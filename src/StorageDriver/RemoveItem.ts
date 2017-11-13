import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {UnlinkFile, removeBackup} from '../utils';
const path = require('path');

/**
 * Removing items will also remove the backup directory for the item as well
 * @param {string} key
 * @param {TElectronStorage} Storage
 * @returns {Promise<any>}
 * @constructor
 */
export const RemoveItem = (key: string, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(baseLocation, Storage.version, 'states', key);
        if (!existsSync(path.join(baseLocation, `${key}.db`))) {
            try {
                Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                // then check to see if backup exists -> if so remove it.
                return removeBackup(fileLocation)
                    .then(resolve)
                    .catch(reject);
            } catch (e) {
                return reject(e);
            }
        } else {
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
        }
    });
};
