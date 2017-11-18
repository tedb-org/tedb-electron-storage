import {IStorageDriverExtended} from '../types';
import {UnlinkFile, removeBackup} from '../utils';
import {safeReadFile} from '../utils/safeReadFile';
const path = require('path');

/**
 * Since the file does exist remove backup directory and file + the current file
 * @param {string} fileLocation
 * @param {string} baseLocation
 * @param {string} key
 * @returns {Promise<any>}
 */
const doesExist = (fileLocation: string, baseLocation: string, key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        return removeBackup(fileLocation)
            .then(() => UnlinkFile(path.join(baseLocation, `index_${key}.db`)))
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Main method
 * removing an index should also remove its backup
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
                    // base file does not exist remove backup
                    return removeBackup(fileLocation);
                } else {
                    return doesExist(fileLocation, baseLocation, key);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
