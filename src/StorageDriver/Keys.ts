import {IStorageDriverExtended} from '../types';
import {ReadDir, safeReadFile, RmDir, UnlinkFile, EnsureDataFile, SafeWrite, safeParse, flattenStorageDriver, safeDirExists} from '../utils';
const path = require('path');

const removeAll = (dirLocation: string, base: string, key: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(dirLocation, key))
            .then(() => EnsureDataFile(path.join(base, `${key}.db`)))
            .then(() => EnsureDataFile(path.join(dirLocation, key, 'past')))
            .then(() => UnlinkFile(path.join(dirLocation, key, 'past')))
            .then(() => RmDir(path.join(dirLocation, key)))
            .then(() => UnlinkFile(path.join(base, `${key}.db`)))
            .then(() => resolve([]))
            .catch(reject);
    });
};

const removeJustbase = (base: string, key: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(base, `${key}.db`))
            .then(() => UnlinkFile(path.join(base, `${key}.db`)))
            .then(() => resolve([]))
            .catch(reject);
    });
};

const RemoveDirectoryAndFile = (base: string, dirLocation: string, key: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(path.join(dirLocation, key))
            .then((bool): Promise<string[]> => {
                if (bool === false) {
                    return removeAll(dirLocation, base, key);
                } else {
                    return removeJustbase(base, key);
                }
            })
            .then(resolve)
            .catch(reject);

    });
};

/**
 * Write backup file data to current file location
 * This is possible since the backup was not corrupted and the _id was retrievable.
 * Using the id as the key to locate the current file path write its data to it and
 * return the _id.
 * @param fileData
 * @param {string} baseLocation
 * @returns {Promise<string[]>}
 * @constructor
 */
const WriteBackupToBaseReturn = (fileData: any, baseLocation: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(baseLocation, `${fileData._id}.db`))
            .then(() => SafeWrite(path.join(baseLocation, `${fileData._id}.db`), fileData))
            .then(() => resolve([fileData._id]))
            .catch(reject);
    });
};

interface IcomboRead {
    key: string;
    rawData: string;
}
const comboFileReadMethod = (dirLocation: string, dir: string | Buffer, key: string | Buffer): Promise<IcomboRead> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(dirLocation, dir, 'past'))
            .then((rawData) => {
                if (rawData === false) {
                    resolve({key: String(key), rawData: ''});
                } else {
                    resolve({key: String(key), rawData: String(rawData)});
                }
            })
            .catch(reject);
    });
};

interface IcomboParse {
    key: string;
    parsedData: any;
}
const comboFileParseMethod = (obj: IcomboRead): Promise<IcomboParse> => {
    return new Promise((resolve, reject) => {
        return safeParse(obj.rawData)
            .then((fileData) => resolve({key: obj.key, parsedData: fileData}))
            .catch(reject);
    });
};

const readBackupDir = (dirLocation: string, baseLocation: string): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
        return ReadDir(dirLocation)
            .then((directories) => {
                // const reg = new RegExp('index_');
                // const noIndexDirectories = directories.filter((dir) => reg.test(dir as string));

                // no Need to filter out index_ or version since files being searched were already filtered
                return Promise.all(directories.map((dir) => {
                    return comboFileReadMethod(dirLocation, dir, dir);
                    // return ReadFile(path.join(dirLocation, dir, 'past'));
                }));
            })
            .then((filesRawData: IcomboRead[]) => {
                return Promise.all(filesRawData.map((obj: IcomboRead) => comboFileParseMethod(obj)));
                // return Promise.all(filesRawData.map((rawData) => safeParse(rawData)));
            })
            .then((filesData: IcomboParse[]): Promise<string[][]> => {
                return Promise.all(filesData.map((fileData) => {
                    if (fileData.parsedData === false) {
                        // this means both current location and backup are unreadable. -> remove both
                        return RemoveDirectoryAndFile(baseLocation, dirLocation, fileData.key);
                    } else {
                        // read backup location, write to baselocation then return _id;
                        return WriteBackupToBaseReturn(fileData.parsedData, baseLocation);
                    }
                }));
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Read the backup file to see if it is parsable
 * if So -> return the key and write data to current location
 * if Not -> delete backup. Can not delete current without reference
 * @param {string} dirLocation
 * @param {string} baseLocation
 * @returns {Promise<string[][]>}
 */
const readBackupLocation = (dirLocation: string, baseLocation: string): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(dirLocation)
            .then((bool): Promise<string[][]> => {
                if (bool === false) {
                    return new Promise((res) => res([[]]));
                } else {
                    return readBackupDir(dirLocation, baseLocation);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const readAllDir = (baseLocation: string, dirLocation: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return ReadDir(baseLocation)
            .then((files) => {
                const reg = new RegExp('index_');
                const vers = new RegExp('`v');
                // don't try and read index files or the version directory
                const noIndexFiles = files.filter((file) => {
                    const thisFile = String(file);
                    if (!reg.test(thisFile) && !vers.test(thisFile)) {
                        return file;
                    }
                });
                // const noIndexFiles = files.filter((file) => reg.test(file as string));
                return Promise.all(noIndexFiles.map((dbFile) => {
                    return safeReadFile(path.join(baseLocation, dbFile));
                }));
            })
            .then((filesRawData: any[]) => {
                return Promise.all(filesRawData.map((rawData) => {
                    if (rawData === false) {
                        return new Promise((rs) => rs(false));
                    } else {
                        return safeParse(rawData);
                    }
                }));
            })
            .then((filesData: any[]): Promise<string[][][]> => {
                return Promise.all(filesData.map((fd) => {
                    if (fd === false) {
                        // search backup location for readable files for each file read its directory
                        // -> dir location is -> appName/collection/version/states/ dir / past
                        return readBackupLocation(dirLocation, baseLocation);
                    } else {
                        // resolve the actual key
                        return (new Promise<string[][]>((res) => res([[fd._id]])));
                    }
                }));
            })
            .then((keys: string[][][]) => {
                const incomingKeys = flattenStorageDriver(keys);
                let KEYS: string[] = [];
                incomingKeys.forEach((key) => {
                    KEYS = [key, ...KEYS];
                });
                resolve([...Storage.allKeys, ...KEYS]);
            })
            .catch(reject);
    });
};

// Search for keys. If a key is found test to see if it is parsable. If not search
// backup location and test if that file is parsable. If not then return null.
// If so then copy backup to baseLocation then return the backup.
const readKeysSafety = (baseLocation: string, dirLocation: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(baseLocation)
            .then((bool): Promise<string[]> => {
                if (bool === false) {
                    return new Promise((res) => res([]));
                } else {
                    return readAllDir(baseLocation, dirLocation, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const readAllLocations = (base: string, dir: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return ReadDir(base)
            .then((files) => {
                const reg = new RegExp('index_');
                const vers = new RegExp('`v');
                // don't try and read index files or the version directory
                const filteredFiles = files.filter((file) => {
                    const thisFile = String(file);
                    if (!reg.test(thisFile) && !vers.test(thisFile)) {
                        return file;
                    }
                });

                if (filteredFiles.length === Storage.allKeys.length) {
                    return Storage.allKeys;
                } else {
                    return readKeysSafety(base, dir, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const checkKeysLocations = (base: string, dir: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(base)
            .then((bool): Promise<string[]> => {
                if (bool === false) {
                    return new Promise((res) => res([]));
                } else {
                    return readAllLocations(base, dir, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

export const Keys = (Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const dirLocation = path.join(baseLocation, Storage.version, 'states');
        if (Storage.allKeys.length === 0) {
            return readKeysSafety(baseLocation, dirLocation, Storage)
                .then(resolve)
                .catch(reject);
        } else {
            // should check current directories files length should match keys length
            // resolve(Storage.allKeys);
            return checkKeysLocations(baseLocation, dirLocation, Storage)
                .then(resolve)
                .catch(reject);
        }
    });
};
