import {IStorageDriverExtended} from '../types';
import {stringifyJSON, EnsureDataFile, CopyAndWrite, SafeWrite, WriteNewPastandBase, MakeVersionDirPast, UnlinkFile, safeDirExists} from '../utils';
import {safeReadFile} from '../utils/safeReadFile';
const path = require('path');

/**
 * Remove the base current file and write empty to backup location
 * @param {string} base
 * @param {string} backupDir
 * @param {string} data
 * @returns {Promise<any>}
 */
const removeBaseWriteBackup = (base: string, backupDir: string, data: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return UnlinkFile(base)
            .then(() => SafeWrite(path.join(backupDir, 'past'), data))
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Possible outcomes of empty indices need to be checked.
 * @param {string} index
 * @returns {boolean}
 */
export const indexCheck = (index: string) => {
    return (index === '[{"key":null,"value":[]}]' || index === '[{"key":null,"value":[null]}]' || index === '[{"key":null, "value":[]}]' || index === '[{"key":null, "value":[null]}]' || index === '[{"key": null, "value": []}]' || index === '[ { key: null, value: [] } ]');
};

export const StoreIndex = (key: string, index: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(Storage.collectionPath, Storage.version, 'states', `index_${key}`);
        /**
         * This is the method used when both are missing -> write data to both files
         * @param {string} StringifiedJSON
         * @returns {Promise<any[]>}
         */
        const returnMany = (StringifiedJSON: string): Promise<any[]> => {
            const allLocations = [path.join(baseLocation, `index_${key}.db`), path.join(fileLocation, 'past')];
            return Promise.all(allLocations.map((writePath) => {
                return EnsureDataFile(writePath)
                    .then(() => SafeWrite(writePath, StringifiedJSON));
            }));
        };
        let stringIndex: string;
        // Always store
        return stringifyJSON(index)
            .then((data) => {
                stringIndex = data;
                return safeReadFile(path.join(baseLocation, `index_${key}.db`));
            })
            .then((dataBool) => {
                if (dataBool === false) {
                    // file does not exist check backup directory
                    return safeDirExists(fileLocation);
                } else {
                    if (indexCheck(stringIndex)) {
                        // index is empty remove base and write to backup location
                        return removeBaseWriteBackup(path.join(baseLocation, `index_${key}.db`), fileLocation, stringIndex);
                    } else {
                        // index is not empty write current to backup and write new to current
                        return CopyAndWrite(path.join(baseLocation, `index_${key}.db`), path.join(fileLocation, 'past'), stringIndex);
                    }
                }
            })
            .then((dataBool) => {
                if (dataBool === false) {
                    if (indexCheck(index)) {
                        // neither backup or base file exists. - and index is empty
                        // write to backup location
                        return removeBaseWriteBackup(path.join(baseLocation, `index_${key}.db`), fileLocation, stringIndex);
                    } else {
                        // no base and no directory but the index is not empty
                        // create backup dir and write data
                        return MakeVersionDirPast(fileLocation, returnMany, stringIndex);
                    }
                } else if (dataBool === null) {
                    // both were found the other checks above resolve null
                    return new Promise((res) => res());
                } else {
                    // no base but backup dir was found
                    if (indexCheck(stringIndex)) {
                        // current is empty write empty index to backup
                        return SafeWrite(path.join(fileLocation, 'past'), stringIndex);
                    } else {
                        // current is empty, index is not, write new data to both backup and current
                        return WriteNewPastandBase(fileLocation, returnMany, path.join(baseLocation, `index_${key}.db`), index);
                    }
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
