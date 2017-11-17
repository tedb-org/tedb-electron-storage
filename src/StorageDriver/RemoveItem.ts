import {IStorageDriverExtended} from '../types';
import {UnlinkFile, removeBackup, safeReadFile} from '../utils';
const path = require('path');

const doesNotExist = (key: string, fileLocation: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
        } catch (e) {
            return reject(e);
        }
        return removeBackup(fileLocation)
            .then(resolve)
            .catch(reject);
    });
};

const doesExist = (key: string, baseLocation: string, fileLocation: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return removeBackup(fileLocation)
            .then(() => UnlinkFile(path.join(baseLocation, `${key}.db`)))
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

/**
 * Removing items will also remove the backup directory for the item as well
 * @param {string} key
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 * @constructor
 */
export const RemoveItem = (key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(baseLocation, Storage.version, 'states', key);
        return safeReadFile(path.join(baseLocation, `${key}.db`))
            .then((databool) => {
                if (databool === false) {
                    return doesNotExist(key, fileLocation, Storage);
                } else {
                    return doesExist(key, baseLocation, fileLocation, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
