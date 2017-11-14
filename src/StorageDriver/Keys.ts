import {IStorageDriverExtended} from '../types';
import {ReadDir, ReadFile, RmDir, UnlinkFile, EnsureDataFile, SafeWrite, safeParse, flatten} from '../utils';
const path = require('path');

const RemoveDirectoryAndFile = (dirLocation: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(dirLocation)
            .then(() => UnlinkFile(path.join(dirLocation, 'past')))
            .then(() => RmDir(dirLocation))
            .then(() => resolve([]))
            .catch(reject);
    });
};

const WriteBackupToBaseReturn = (fileData: any, baseLocation: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(baseLocation, `${fileData._id}.db`))
            .then(() => SafeWrite(path.join(baseLocation, `${fileData._id}.db`), fileData))
            .then(() => resolve([fileData._id as string]))
            .catch(reject);
    });
};

const readBackupLocation = (dirLocation: string, baseLocation: string): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
        return ReadDir(dirLocation)
            .then((directories) => {
                const reg = new RegExp('index_');
                const noIndexDirectories = directories.filter((dir) => reg.test(dir as string));
                return Promise.all(noIndexDirectories.map((dir) => {
                    return ReadFile(path.join(dirLocation, dir, 'past'));
                }));
            })
            .then((filesData: string[]) => {
                return Promise.all(filesData.map((fd) => safeParse(fd)));
            })
            .then((filesData: any[]): Promise<string[][]> => {
                return Promise.all(filesData.map((fd) => {
                    if (fd === false) {
                        return RemoveDirectoryAndFile(dirLocation);
                    } else {
                        // read backup location, write to baselocation then return _id;
                        return WriteBackupToBaseReturn(fd, baseLocation);
                    }
                }));
            })
            .then(resolve)
            .catch(reject);
    });
};

// Search for keys. If a key is found test to see if it is parsable. If not search
// backup location and test if that file is parsable. If not then return null.
// If so then copy backup to baseLocation then return the backup.
const readKeysSafety = (baseLocation: string, dirLocation: string, Storage: IStorageDriverExtended): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        return ReadDir(baseLocation)
            .then((files) => {
                const reg = new RegExp('index_');
                const noIndexFiles = files.filter((file) => reg.test(file as string));
                return Promise.all(noIndexFiles.map((dbFile) => {
                    return ReadFile(path.join(baseLocation, dbFile));
                }));
            })
            .then((filesData: string[]) => {
                return Promise.all(filesData.map((fd) => safeParse(fd)));
            })
            .then((filesData: any[]): Promise<string[][][]> => {
                return Promise.all(filesData.map((fd) => {
                    if (fd === false) {
                        return readBackupLocation(dirLocation, baseLocation);
                    } else {
                        return (new Promise<string[][]>((res) => res([[]])));
                    }
                }));
            })
            .then((keys: string[][][]) => {
                const incomingKeys = flatten(keys);
                let KEYS: string[] = [];
                incomingKeys.forEach((key) => {
                    KEYS = [...key];
                });
                resolve([...Storage.allKeys, ...KEYS]);
            })
            .catch(reject);
    });
};

export const Keys = (Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (Storage.allKeys.length === 0) {
            const baseLocation = Storage.collectionPath;
            const dirLocation = path.join(baseLocation, Storage.version, 'states');
            return readKeysSafety(baseLocation, dirLocation, Storage)
                .then(resolve)
                .catch(reject);
        } else {
            resolve(Storage.allKeys);
        }
    });
};
