import {IStorageDriverExtended} from '../types';
import {SafeWrite, MakeVersionDirPast, stringifyJSON, EnsureDataFile, CopyAndWrite, WriteNewPastandBase, safeReadFile, safeDirExists} from '../utils';
const path = require('path');

const checkNext = (fileLocation: string, baseLocation: string, data: string, returnMany: any) => {
    return new Promise((resolve, reject) => {
        return safeDirExists(fileLocation)
            .then((databool) => {
                if (databool === false) {
                    return MakeVersionDirPast(fileLocation, returnMany, data);
                } else {
                    return WriteNewPastandBase(fileLocation, baseLocation, data);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

export const SetItem = (key: string, value: any, Storage: IStorageDriverExtended): Promise<any> => {
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
        let stringValue: string;
        return stringifyJSON(value)
            .then((data) => {
                stringValue = data;
                return safeReadFile(path.join(baseLocation, `${key}.db`));
            })
            .then((databool) => {
                if (databool === false) {
                    return checkNext(fileLocation, path.join(baseLocation, `${key}.db`), stringValue, returnMany);
                } else {
                    return CopyAndWrite(path.join(baseLocation, `${key}.db`), path.join(fileLocation, 'past'), stringValue);
                }
            })
            .then(() => {
                if (Storage.allKeys.indexOf(key) === -1) {
                    Storage.allKeys.push(key);
                }
                return value;
            })
            .then(resolve)
            .catch(reject);
        /*return stringifyJSON(value)
            .then((data) => {
                if (existsSync(path.join(baseLocation, `${key}.db`))) {
                    return CopyAndWrite(path.join(baseLocation, `${key}.db`), path.join(fileLocation, 'past'), data);
                } else {
                    if (existsSync(fileLocation)) {
                        return WriteNewPasteandBase(fileLocation, baseLocation, data);
                    } else {
                        return MakeVersionDirPast(fileLocation, returnMany, data);
                    }
                }
            })
            .then(() => {
                if (Storage.allKeys.indexOf(key) === -1) {
                    Storage.allKeys.push(key);
                }
                return value;
            })
            .then(resolve)
            .catch(reject);*/
    });
};
