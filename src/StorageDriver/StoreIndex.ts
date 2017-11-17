import {IStorageDriverExtended} from '../types';
import {stringifyJSON, EnsureDataFile, CopyAndWrite, SafeWrite, WriteNewPastandBase, MakeVersionDirPast, UnlinkFile, safeDirExists} from '../utils';
import {safeReadFile} from '../utils/safeReadFile';
const path = require('path');

const removeBaseWriteBackup = (base: string, backupDir: string, data: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return UnlinkFile(base)
            .then(() => SafeWrite(path.join(backupDir, 'past'), data))
            .then(resolve)
            .catch(reject);
    });
};

export const indexCheck = (index: string) => {
    return (index === '[{"key":null,"value":[]}]' || index === '[{"key":null,"value":[null]}]' || index === '[{"key":null, "value":[]}]' || index === '[{"key":null, "value":[null]}]' || index === '[{"key": null, "value": []}]' || index === '[ { key: null, value: [] } ]');
};

export const StoreIndex = (key: string, index: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(Storage.collectionPath, Storage.version, 'states', `index_${key}`);
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
                    return safeDirExists(fileLocation);
                } else {
                    if (indexCheck(stringIndex)) {
                        return removeBaseWriteBackup(path.join(baseLocation, `index_${key}.db`), fileLocation, stringIndex);
                    } else {
                        return CopyAndWrite(path.join(baseLocation, `index_${key}.db`), path.join(fileLocation, 'past'), stringIndex);
                    }
                }
            })
            .then((dataBool) => {
                if (dataBool === false) {
                    if (indexCheck(index)) {
                        // neither backup or base file exists. - resolve
                        return new Promise((res) => res());
                    } else {
                        return MakeVersionDirPast(fileLocation, returnMany, stringIndex);
                    }
                } else if (dataBool === null) {
                    return new Promise((res) => res());
                } else {
                    if (indexCheck(stringIndex)) {
                        return SafeWrite(path.join(fileLocation, 'past'), stringIndex);
                    } else {
                        return WriteNewPastandBase(fileLocation, path.join(baseLocation, `index_${key}.db`), index);
                    }
                }
            })
            .then(resolve)
            .catch(reject);
       /* return stringifyJSON(index)
            .then((data) => {
                if (existsSync(path.join(baseLocation, `index_${key}.db`))) {
                    if (indexCheck(data)) {
                        // the index is null - remove base file and write this to backup
                        return removeBaseWriteBackup(path.join(baseLocation, `index_${key}.db`), fileLocation, data);
                    } else {
                        // store the index
                        return CopyAndWrite(path.join(baseLocation, `index_${key}.db`), path.join(fileLocation, 'past'), data);
                    }
                } else {
                    if (existsSync(fileLocation)) {
                        if (indexCheck(index)) {
                            // the base file does not exist - but the backup does
                            // do not write to base file but write this to backup
                            return SafeWrite(path.join(fileLocation, 'past'), data);
                        } else {
                            return WriteNewPasteandBase(fileLocation, baseLocation, index);
                        }
                    } else {
                        if (indexCheck(index)) {
                            // neither backup or base file exists. - resolve
                            return new Promise((res) => res());
                        } else {
                            return MakeVersionDirPast(fileLocation, returnMany, data);
                        }
                    }
                }
            })
            .then(resolve)
            .catch(reject);*/
    });
};
