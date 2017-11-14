import {IStorageDriverExtended, TiteratorCB} from '../types';
import {existsSync} from 'fs';
import {ReadDir, ReadFile, safeParse, UnlinkFile, RmDir, CopyFile} from '../utils';
const path = require('path');

const removeAll = (current: string, backup: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return UnlinkFile(path.join(backup, 'past'))
            .then(() => RmDir(backup))
            .then(() => UnlinkFile(current))
            .then(resolve)
            .catch(reject);
    });
};

const iterateAndReplace = (current: string, backup: string, iterator: TiteratorCB, data: any): Promise<null> => {
    return new Promise((resolve, reject) => {
        return CopyFile(path.join(backup, 'past'), current)
            .then(() => {
                if (data.hasOwnProperty('_id')) {
                    resolve(iterator(data, data._id));
                } else {
                    resolve();
                }
            })
            .catch(reject);
    });
};

const readAndReplace = (currentFile: string, backup: string, iterator: TiteratorCB): Promise<null> => {
    return new Promise((resolve, reject) => {
        return ReadFile(path.join(backup, 'past'))
            .then((rawData) => safeParse(rawData))
            .then((dataBool) => {
                if (dataBool === false) {
                    // cant read. delete all
                    return removeAll(currentFile, backup);
                } else {
                    // can read - iterate and replace
                    return iterateAndReplace(currentFile, backup, iterator, dataBool);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const checkBackup = (currentFile: string, key: string, Storage: IStorageDriverExtended, iterator: TiteratorCB): Promise<null> => {
    return new Promise((resolve, reject) => {
        const backup = path.join(Storage.collectionPath, Storage.version, 'states', key);
        if (existsSync(backup)) {
            // backup directory exists
            if (existsSync(path.join(backup, 'past'))) {
                // backup file exists
                return readAndReplace(currentFile, backup, iterator);
            } else {
                // backup file does not exist. Remove dir and current file
                return RmDir(backup)
                    .then(() => UnlinkFile(currentFile))
                    .then(resolve)
                    .then(reject);
            }
        } else {
            // delete current file and resolve nothing
            return UnlinkFile(currentFile)
                .then(resolve)
                .catch(reject);
        }
    });
};

// not tested
const readParseIterate = (filename: string, iterator: TiteratorCB, key: string, Storage: IStorageDriverExtended) => {
    return new Promise((resolve, reject) => {
        return ReadFile(filename)
            .then((data) => safeParse(data))
            .then((dataBool) => {
                if (dataBool === false) {
                    // check backup
                    return checkBackup(filename, key, Storage, iterator);
                } else {
                    if (dataBool.hasOwnProperty('_id')) {
                        return iterator(dataBool, dataBool._id);
                    } else {
                        return null;
                    }
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

export const Iterate = (iteratorCallback: TiteratorCB, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        if (!existsSync(baseLocation)) {
            return reject(`:::Storage::: No directory at ${baseLocation}`);
        } else {
            return ReadDir(baseLocation)
                .then((files) => {
                    const indexFile = new RegExp('index_');
                    const version = new RegExp('$v');
                    const filteredFiles = files.filter((file) => {
                        const thisFile = file.toString();
                        if (!indexFile.test(thisFile) && !version.test(thisFile)) {
                            return file;
                        }
                    });
                    return Promise.all(filteredFiles.map((file) => {
                        const filename = path.join(baseLocation, file);
                        const key = file.toString().substr(0, file.toString().indexOf('.'));
                        return readParseIterate(filename, iteratorCallback, key, Storage);
                    }));
                })
                .then(resolve)
                .catch(reject);
        }
    });
};
