import {IStorageDriverExtended, TiteratorCB} from '../types';
import {ReadDir, safeReadFile, safeParse, UnlinkFile, RmDir, CopyFile, safeDirExists} from '../utils';
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
            .then((): Promise<null> => {
                if (data.hasOwnProperty('_id')) {
                    iterator(data, data._id);
                }
                return new Promise((res) => res());
            })
            .then(resolve)
            .catch(reject);
    });
};

const readandReplaceParse = (rawData: any, currentFile: string, backup: string, iterator: TiteratorCB): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeParse(rawData)
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

const readAndReplace = (currentFile: string, backup: string, iterator: TiteratorCB): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(backup, 'past'))
            .then((rawData): Promise<null> => {
                if (rawData === false) {
                    return new Promise((rs) => rs());
                } else {
                    return readandReplaceParse(rawData, currentFile, backup, iterator);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const rmBoth = (backup: string, currentFile: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return RmDir(backup)
            .then(() => UnlinkFile(currentFile))
            .then(resolve)
            .catch(reject);
    });
};

const checkNext = (backup: string, currentFile: string, iterator: TiteratorCB): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(backup, 'past'))
            .then((databool): Promise<null> => {
                if (databool === false) {
                    return rmBoth(backup, currentFile);
                } else {
                    return readAndReplace(currentFile, backup, iterator);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const checkBackup = (currentFile: string, key: string, Storage: IStorageDriverExtended, iterator: TiteratorCB): Promise<null> => {
    return new Promise((resolve, reject) => {
        const backup = path.join(Storage.collectionPath, Storage.version, 'states', key);
        return safeDirExists(backup)
            .then((databool): Promise<null> => {
                if (databool === false) {
                    return UnlinkFile(currentFile);
                } else {
                    return checkNext(backup, currentFile, iterator);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const continueReadParse = (data: any, key: string, filename: string, iterator: TiteratorCB, Storage: IStorageDriverExtended): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeParse(data)
            .then((dataBool) => {
                if (dataBool === false) {
                    // check backup
                    return checkBackup(filename, key, Storage, iterator);
                } else {
                    if (dataBool.hasOwnProperty('_id')) {
                        return iterator(dataBool, dataBool._id);
                    } else {
                        return new Promise((res) => res());
                    }
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const readParseIterate = (filename: string, iterator: TiteratorCB, key: string, Storage: IStorageDriverExtended): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(filename)
            .then((data): Promise<null> => {
                if (data === false) {
                    return new Promise((rs) => rs());
                } else {
                    return continueReadParse(data, key, filename, iterator, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const actualRead = (baseLocation: string, iteratorCallback: TiteratorCB, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return ReadDir(baseLocation)
            .then((files) => {
                const indexFile = new RegExp('index_');
                const version = new RegExp('`v');
                const filteredFiles = files.filter((file) => {
                    const thisFile = String(file);
                    if (!indexFile.test(thisFile) && !version.test(thisFile)) {
                        return file;
                    }
                });
                return Promise.all(filteredFiles.map((file) => {
                    const stringedFile = String(file);
                    const filename = path.join(baseLocation, file);
                    let key;
                    if (typeof file === 'string') {
                        key = file.substr(0, file.indexOf('.'));
                    } else {
                        key = stringedFile.substr(0, stringedFile.indexOf('.'));
                    }

                    return readParseIterate(filename, iteratorCallback, key, Storage);
                }));
            })
            .then(resolve)
            .catch(reject);
    });
};

export const Iterate = (iteratorCallback: TiteratorCB, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        return safeDirExists(baseLocation)
            .then((databool) => {
                if (databool === false) {
                    console.log(`:::Storage::: No directory at ${baseLocation}`);
                    return new Promise((res) => res());
                } else {
                    // dir exists
                    return actualRead(baseLocation, iteratorCallback, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
