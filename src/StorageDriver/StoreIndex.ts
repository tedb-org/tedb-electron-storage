import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {stringifyJSON, EnsureDataFile, CopyAndWrite, SafeWrite, WriteNewPastandBase, MakeVersionDirPast} from '../utils';
const path = require('path');

export const StoreIndex = (key: string, index: string, Storage: TElectronStorage): Promise<any> => {
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
        // index is empty
        /*if (index === '[{"key":null,"value":[null]}]' || index === '[{"key":null, "value":[]}]') {
            // Read into tedb & ClientElectron to see why this is.
            // Why do I need to delete the file if the incoming index is empty?
        } else {
            return stringifyJSON(index)
                .then((data) => {
                    if (existsSync(path.join(baseLocation, `index_${key}.db`))) {
                        return CopyAndWrite(fileLocation, path.join(baseLocation, `index_${key}.db`), data);
                    } else {
                        if (existsSync(fileLocation)) {
                            return WriteNewPastandBase(fileLocation, baseLocation, index);
                        } else {
                            return MakeVersionDirPast(fileLocation, returnMany, data);
                        }
                    }
                })
                .then(resolve)
                .catch(reject);
        }*/
        return stringifyJSON(index)
            .then((data) => {
                if (existsSync(path.join(baseLocation, `index_${key}.db`))) {
                    return CopyAndWrite(fileLocation, path.join(baseLocation, `index_${key}.db`), data);
                } else {
                    if (existsSync(fileLocation)) {
                        return WriteNewPastandBase(fileLocation, baseLocation, index);
                    } else {
                        return MakeVersionDirPast(fileLocation, returnMany, data);
                    }
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
