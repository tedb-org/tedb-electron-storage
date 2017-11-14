import {IStorageDriverExtended} from '../types';
import {existsSync} from 'fs';
import {stringifyJSON, EnsureDataFile, CopyAndWrite, SafeWrite, WriteNewPasteandBase, MakeVersionDirPast, UnlinkFile} from '../utils';
const path = require('path');

const removeBaseWriteBackup = (base: string, backupDir: string, data: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return UnlinkFile(base)
            .then(() => SafeWrite(path.join(backupDir, 'past'), data))
            .then(resolve)
            .catch(reject);
    });
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
        // Always store
        return stringifyJSON(index)
            .then((data) => {
                if (existsSync(path.join(baseLocation, `index_${key}.db`))) {
                    if (data === '[{"key":null,"value":[]}]') {
                        // the index is null - remove base file and write this to backup
                        return removeBaseWriteBackup(path.join(baseLocation, `index_${key}.db`), fileLocation, data);
                    } else {
                        // store the index
                        return CopyAndWrite(path.join(baseLocation, `index_${key}.db`), path.join(fileLocation, 'past'), data);
                    }
                } else {
                    if (existsSync(fileLocation)) {
                        if (index === '[{"key":null,"value":[]}]') {
                            // the base file does not exist - but the backup does
                            // do not write to base file but write this to backup
                            return SafeWrite(path.join(fileLocation, 'past'), data);
                        } else {
                            return WriteNewPasteandBase(fileLocation, baseLocation, index);
                        }
                    } else {
                        if (index === '[{"key":null,"value":[]}]') {
                            // neither backup or base file exists. - resolve
                            return new Promise((res) => res());
                        } else {
                            return MakeVersionDirPast(fileLocation, returnMany, data);
                        }
                    }
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
