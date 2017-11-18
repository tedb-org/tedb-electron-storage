import {IStorageDriverExtended} from '../types';
import {SafeWrite, MakeVersionDirPast, stringifyJSON, EnsureDataFile, CopyAndWrite, WriteNewPastandBase, safeReadFile, safeDirExists} from '../utils';
const path = require('path');

/**
 * Check backup file location and see if data is readable there.
 * @param {string} fileLocation
 * @param {string} baseLocation
 * @param {string} data
 * @param returnMany
 * @returns {Promise<any>}
 */
const checkNext = (fileLocation: string, baseLocation: string, data: string, returnMany: any) => {
    return new Promise((resolve, reject) => {
        return safeDirExists(fileLocation)
            .then((databool) => {
                if (databool === false) {
                    // no backup write data to both current and backup
                    return MakeVersionDirPast(fileLocation, returnMany, data);
                } else {
                    // the backup directory exists
                    return WriteNewPastandBase(fileLocation, returnMany, baseLocation, data);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Main method
 * When setting an item it will check to see that the data can be converted back and forth
 * from string to an object before trying to write. It will also move current file
 * to the past location if the current file already exists. If not the current and past
 * will be written with the current data. This should only happen once unless both files
 * are removed.
 * @param {string} key
 * @param value
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 * @constructor
 */
export const SetItem = (key: string, value: any, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(Storage.collectionPath, Storage.version, 'states', key);
        /**
         * This is the method used when both files are missing -> write data to both files
         * @param {string} StringifiedJSON
         * @returns {Promise<any[]>}
         */
        const returnMany = (StringifiedJSON: string): Promise<any[]> => {
            const allLocations = [path.join(baseLocation, `${key}.db`), path.join(fileLocation, 'past')];
            return Promise.all(allLocations.map((writePath) => {
                return EnsureDataFile(writePath)
                    .then(() => SafeWrite(writePath, StringifiedJSON));
            }));
        };
        let stringValue: string;
        return stringifyJSON(value)
            .then((data) => {
                stringValue = data; // convert data to string to be written to files
                return safeReadFile(path.join(baseLocation, `${key}.db`));
            })
            .then((databool) => {
                if (databool === false) {
                    // file to be written to does not exist. Check backup
                    return checkNext(fileLocation, path.join(baseLocation, `${key}.db`), stringValue, returnMany);
                } else {
                    // file exists copy current file to backup location and write new data to current
                    return CopyAndWrite(path.join(baseLocation, `${key}.db`), path.join(fileLocation, 'past'), stringValue);
                }
            })
            .then(() => {
                // if this key does not exist in keys insert it.
                if (Storage.allKeys.indexOf(key) === -1) {
                    Storage.allKeys.push(key);
                }
                return value; // finally resolve the original data
            })
            .then(resolve)
            .catch(reject);
    });
};
