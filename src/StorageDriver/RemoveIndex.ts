import {IStorageDriverExtended} from '../types';
import {UnlinkFile, removeBackup} from '../utils';
import {safeReadFile} from '../utils/safeReadFile';
const path = require('path');

const doesExist = (fileLocation: string, baseLocation: string, key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        return removeBackup(fileLocation)
            .then(() => UnlinkFile(path.join(baseLocation, `index_${key}.db`)))
            .then(resolve)
            .catch(reject);
    });
};

/**
 * When removing the index it the backup should also be removed.
 * @param {string} key
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 * @constructor
 */
export const RemoveIndex = (key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(baseLocation, Storage.version, 'states', `index_${key}`);
        return safeReadFile(path.join(baseLocation, `index_${key}.db`))
            .then((databool) => {
                if (databool === false) {
                    return removeBackup(fileLocation);
                } else {
                    return doesExist(fileLocation, baseLocation, key);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
