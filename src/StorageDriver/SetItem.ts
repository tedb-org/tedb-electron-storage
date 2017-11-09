import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {SafeWrite, MakeVersionDirPast, stringifyJSON, EnsureDataFile, CopyAndWrite, WriteNewPastandBase} from '../utils';
const path = require('path');

export const SetItem = (key: string, value: any, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(Storage.collectionPath, Storage.version, 'states', key);
        const returnMany = (StringifiedJSON: string): Promise<any[]> => {
            const allLocations = [path.join(baseLocation, `${key}.db`), path.join(fileLocation, 'past')];
            return Promise.all(allLocations.map((writePath) => {
                return EnsureDataFile(writePath)
                    .then(() => SafeWrite(writePath, StringifiedJSON));
            }));
        };
        return stringifyJSON(value)
            .then((data) => {
                if (existsSync(path.join(baseLocation, `${key}.db`))) {
                    return CopyAndWrite(fileLocation, path.join(baseLocation, `${key}.db`), data);
                } else {
                    if (existsSync(fileLocation)) {
                        return WriteNewPastandBase(fileLocation, baseLocation, data);
                    } else {
                        return MakeVersionDirPast(fileLocation, returnMany, data);
                    }
                }
            })
            .then(() => value)
            .then(resolve)
            .catch(reject);
    });
};
