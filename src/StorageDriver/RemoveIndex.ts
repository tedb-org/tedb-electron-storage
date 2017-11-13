import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {UnlinkFile, removeBackup} from '../utils';
const path = require('path');

/**
 * When removing the index it the backup should also be removed.
 * @param {string} key
 * @param {TElectronStorage} Storage
 * @returns {Promise<any>}
 * @constructor
 */
export const RemoveIndex = (key: string, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(baseLocation, Storage.version, 'states', `index_${key}`);
        if (!existsSync(path.join(baseLocation, `index_${key}.db`))) {
            return removeBackup(fileLocation)
                .then(resolve)
                .catch(reject);
        } else {
            return removeBackup(fileLocation)
                .then(() => UnlinkFile(path.join(baseLocation, `index_${key}.db`)))
                .then(resolve)
                .catch(reject);
        }
    });
};
