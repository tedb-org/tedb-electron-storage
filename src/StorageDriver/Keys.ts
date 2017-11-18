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
    read: boolean;
}
const comboFileReadFMethod = (baseLocation: string, key: string): Promise<IcomboRead> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(baseLocation, `${key}.db`))
            .then((rawData) => {
                if (rawData === false) {
                    resolve({key, rawData: '', read: false});
                } else {
                    resolve({key, rawData: String(rawData), read: true});
                }
            })
            .catch(reject);
    });
};
const comboFileReadMethod = (dirLocation: string, dir: string | Buffer, key: string | Buffer): Promise<IcomboRead> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(dirLocation, dir, 'past'))
            .then((rawData) => {
                if (rawData === false) {
                    resolve({key: String(key), rawData: '', read: false});
                } else {
                    resolve({key: String(key), rawData: String(rawData), read: true});
                }
            })
            .catch(reject);
    });
};

interface IcomboParse {
    key: string;
    parsedData: any;
    read: boolean;
}

const comboFileParseMethod = (obj: IcomboRead): Promise<IcomboParse> => {
    return new Promise((resolve, reject) => {
        return safeParse(obj.rawData)
            .then((fileData) => resolve({key: obj.key, parsedData: fileData, read: obj.read}))
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
                return Promise.all(filesRawData.map((obj: IcomboRead): Promise<IcomboParse> => {
                    if (obj.read === false) {
                        return new Promise((rs) => rs({key: obj.key, parsedData: obj.rawData, read: obj.read}));
                    } else {
                        return comboFileParseMethod(obj);
                    }
                }));
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

// need to make what I did for the backup up here
// a separate method to return objects of information to
// save the key

const removeBaseButreturDoubleArr = (base: string, key: string): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(base, `${key}.db`))
            .then(() => UnlinkFile(path.join(base, `${key}.db`)))
            .then(() => resolve([[]]))
            .catch(reject);
    });
};

/**
 * Read the backup file to see if it is parsable
 * if So -> return the key and write data to current location
 * if Not -> delete backup. Can not delete current without reference
 * @param {string} dirLocation
 * @param {string} baseLocation
 * @param {IcomboParse} obj
 * @returns {Promise<string[][]>}
 */
const readBackupLocation = (dirLocation: string, baseLocation: string, obj: IcomboParse): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(dirLocation)
            .then((bool): Promise<string[][]> => {
                if (bool === false) {
                    // remove base location file that
                    // was found but unparsable
                    return removeBaseButreturDoubleArr(baseLocation, obj.key);
                    // return new Promise((res) => res([[]]));
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
                    const key = String(dbFile).substr(0, String(dbFile).indexOf('.'));
                    return comboFileReadFMethod(baseLocation, key);
                }));
                /*return Promise.all(noIndexFiles.map((dbFile) => {
                    return safeReadFile(path.join(baseLocation, dbFile));
                }));*/
            })
            .then((filesRawData: IcomboRead[]) => {
                return Promise.all(filesRawData.map((obj: IcomboRead): Promise<IcomboParse> => {
                    if (obj.read === false) {
                        return new Promise((rs) => rs({key: obj.key, parsedData: obj.rawData, read: obj.read}));
                    } else {
                        return comboFileParseMethod(obj);
                        // return safeParse(rawData);
                    }
                }));
            })
            .then((filesData: IcomboParse[]): Promise<string[][][]> => {
                return Promise.all(filesData.map((fd) => {
                    if (fd.parsedData === false) {
                        // search backup location for readable files for each file read its directory
                        // -> dir location is -> appName/collection/version/states/ dir / past
                        return readBackupLocation(dirLocation, baseLocation, fd);
                    } else {
                        // resolve the actual key
                        return (new Promise<string[][]>((res) => res([[fd.parsedData._id]])));
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

const readKeysSafetyBackup = (base: string, dir: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        // if this is called backup directory is already verified to exist
        return ReadDir(dir)
            .then((directories) => {
                const reg = new RegExp('index_');
                // don't try and read index directories
                const noIndexDir = directories.filter((Dir) => {
                    const thisFile = String(Dir);
                    if (!reg.test(thisFile)) {
                        return Dir;
                    }
                });
                // read in each backup file
                return Promise.all(noIndexDir.map((dirkey) => {
                    return comboFileReadMethod(dir, dirkey, dirkey);
                }));
            })
            .then((filesRawData: IcomboRead[]) => {
                return Promise.all(filesRawData.map((obj: IcomboRead): Promise<IcomboParse> => {
                    if (obj.read === false) {
                        return new Promise((rs) => rs({key: obj.key, parsedData: obj.rawData, read: obj.read}));
                    } else {
                        return comboFileParseMethod(obj);
                    }
                }));
            })
            .then((filesData: IcomboParse[]): Promise<string[][]> => {
                return Promise.all(filesData.map((fd) => {
                    if (fd.parsedData === false) {
                        // obviously the backup file is not readable remove it and
                        // the backup directory -> base already does not exist
                        return RemoveDirectoryAndFile(base, dir, fd.key);
                    } else {
                        // resolve the actual key
                        return WriteBackupToBaseReturn(fd.parsedData, base);
                        // return (new Promise<string[][]>((res) => res([[fd._id]])));
                    }
                }));
            })
            .then((keys: string[][]) => {
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

/**
 * Search for keys. If a key is found test to see if it is parsable. If not search
 * backup location and test if that file is parsable. If not then return null.
 * If so then copy backup to baseLocation then return the backup.
 * @param {string} baseLocation
 * @param {string} dirLocation
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<string[]>}
 */
const readKeysSafety = (baseLocation: string, dirLocation: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(baseLocation)
            .then((bool): Promise<string[]> => {
                if (bool === false) {
                    // check backup just like readAllLocations does for the base dir.
                    return readBackupAllLocations(baseLocation, dirLocation, Storage);
                } else {
                    return readAllDir(baseLocation, dirLocation, Storage);
                }
            })
            .then((keys) => {
                keys = keys.filter((k) => k !== undefined);
                resolve(keys);
            })
            .catch(reject);
    });
};

const readTheBackupDir = (base: string, dir: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return ReadDir(dir)
            .then((directories) => {
                const reg = new RegExp('index_');
                // don't try and read index directories
                const dirs = directories.filter((directoryKey) => {
                    const thisDir = String(directoryKey);
                    if (!reg.test(thisDir)) {
                        return directoryKey;
                    }
                });
                if (dirs.length === Storage.allKeys.length) {
                    // return keys because they match current length
                    return Storage.allKeys;
                } else {
                    // key lengths did not match up -> acts just like
                    // readKeysSafety except for the backup directory
                    // if this is called no need to check dir it already exists
                    return readKeysSafetyBackup(base, dir, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const readBackupAllLocations = (base: string, dir: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(dir)
            .then((bool): Promise<string[]> => {
                if (bool === false) {
                    // this is called when both the base directory and backup are empty
                    return new Promise((res) => res([]));
                } else {
                    // backup dir has values
                    return readTheBackupDir(base, dir, Storage);
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
                    // return keys because they match current length
                    return Storage.allKeys;
                } else {
                    // key lengths did not match up
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
                    // check backup just like readAllLocations does for the base dir.
                    return readBackupAllLocations(base, dir, Storage);
                } else {
                    // base location exists check files and check resulting length
                    return readAllLocations(base, dir, Storage);
                }
            })
            .then((keys) => {
                keys = keys.filter((k) => k !== undefined);
                resolve(keys);
            })
            .catch(reject);
    });
};

/**
 * Main method
 * Keys is a method that should return all the file keys
 * The storage Driver does hold the keys in memory but many occurrences
 * may remove a file from the file system and not remove the key from the
 * Storage driver
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 * @constructor
 */
export const Keys = (Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const dirLocation = path.join(baseLocation, Storage.version, 'states');
        if (Storage.allKeys.length === 0) {
            // No keys in Storage driver check file system files
            return readKeysSafety(baseLocation, dirLocation, Storage)
                .then(resolve)
                .catch(reject);
        } else {
            // should check current directories files length should match keys length
            return checkKeysLocations(baseLocation, dirLocation, Storage)
                .then(resolve)
                .catch(reject);
        }
    });
};
