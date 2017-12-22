import {IStorageDriverExtended} from '../types';
import {ReadDir, UnlinkFile, RmDir, safeDirExists, EnsureDataFile} from '../utils';
const path = require('path');

const checkBaseFileRemove = (baseFile: string) => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(baseFile)
            .then(() => UnlinkFile(baseFile))
            .then(() => resolve())
            .catch(reject);
    });
};

const checkBackupFilekAndRemoveAll = (baseFile: string, dir: string) => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(dir, 'past'))
            .then(() => UnlinkFile(path.join(dir, 'past')))
            .then(() => RmDir(dir))
            .then(() => checkBaseFileRemove(baseFile))
            .then(resolve)
            .catch(reject);
    });
};

const removeAll = (dirLocation: string, base: string, key: string, Storage: IStorageDriverExtended): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(path.join(dirLocation, key))
            .then((bool) => {
                if (bool === false) {
                    return checkBaseFileRemove(path.join(base, `${key}.db`));
                } else {
                    return checkBackupFilekAndRemoveAll(path.join(base, `${key}.db`), path.join(dirLocation, key));
                }
            })
            .then(() => {
                try {
                    Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                } catch (e) {
                    throw e;
                }
                resolve();
            })
            .catch(reject);
    });
};

interface IKeyExists {
    key: string;
    exists: boolean;
}

const checkExist = (key: string, keys: string[]): Promise<IKeyExists> => {
    return new Promise((resolve, reject) => {
        if (keys.indexOf(key) === -1) {
            return resolve({key, exists: false});
        } else {
            return resolve({key, exists: true});
        }
    });
};

const checkDir = (keys: string[], base: string, dir: string, Storage: IStorageDriverExtended): Promise<null> => {
    return new Promise((resolve, reject) => {
        return ReadDir(base)
            .then((files) => {
                // filter out indices;
                const reg = new RegExp('index_');
                const vers = new RegExp('`v');
                const filteredKeys = files.reduce((acc: string[], file: string) => {
                    if (!reg.test(file) && !vers.test(file)) {
                        const thisKey = String(file).substr(0, String(file).indexOf('.'));
                        return acc.concat(thisKey);
                    } else {
                        return acc;
                    }
                }, []);
                return Promise.all(filteredKeys.map((key) => checkExist(key, keys)));
            })
            .then((res: IKeyExists[]) => {
                return Promise.all(res.map((item: IKeyExists) => {
                    if (!item.exists) {
                        return removeAll(dir, base, item.key, Storage);
                    } else {
                        return new Promise((resp) => resp());
                    }
                }));
            })
            .then(() => resolve())
            .catch(reject);
    });
};

export const CollectionSanitize = (keys: string[], Storage: IStorageDriverExtended): Promise<null> => {
    return new Promise((resolve, reject) => {
        // read all files in directory
        // does this file key exist in keys?
        // if yes no-op
        // else remove backup and base
        const baseLocation = Storage.collectionPath;
        const dirLocation = path.join(baseLocation, Storage.version, 'states');
        return safeDirExists(baseLocation)
            .then((bool): Promise<null> => {
                if (bool === false) {
                    return new Promise((res) => res());
                } else {
                    return checkDir(keys, baseLocation, dirLocation, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
