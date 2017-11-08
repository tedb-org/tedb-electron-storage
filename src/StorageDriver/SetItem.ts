import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {SafeWrite, MakeDir, stringifyJSON, CopyFile} from '../utils';
const path = require('path');

const missingFinalLocation = (fileLocation: string, returnMany: any, data: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return MakeDir(fileLocation)
            .then(() => returnMany(data))
            .then(resolve)
            .catch(reject);
    });
};

const copyAndWrite = (fileLocation: string, baseLocation: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return CopyFile(baseLocation, path.join(fileLocation, 'past'))
            .then(() => {
                return SafeWrite(baseLocation, data);
            })
            .then(resolve)
            .catch(reject);
    });
};

const writeNewLocations = (fileLocation: string, baseLocation: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return SafeWrite(baseLocation, data)
            .then(() => {
                return SafeWrite(path.join(fileLocation, 'past'), data);
            })
            .then(resolve)
            .catch(reject);
    });
};

export const SetItem = (key: string, value: any, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = path.join(Storage.collectionPath, `${key}.db`);
        const fileLocation = path.join(Storage.collectionPath, Storage.version, 'states', key);
        const returnMany = (StringifiedJSON: string): Promise<any[]> => {
            const allLocations = [path.join(Storage.collectionPath, `${key}.db`), path.join(fileLocation, 'past')];
            const promises: Array<Promise<any>> = [];
            allLocations.forEach((writePath) => {
                promises.push(SafeWrite(writePath, StringifiedJSON));
            });
            return Promise.all(promises);
        };
        return stringifyJSON(value)
            .then((data) => {
                if (existsSync(path.join(Storage.collectionPath, `${key}.db`))) {
                    return copyAndWrite(fileLocation, baseLocation, data);
                } else {
                    if (existsSync(fileLocation)) {
                        return writeNewLocations(fileLocation, baseLocation, data);
                    } else {
                        return missingFinalLocation(fileLocation, returnMany, data);
                    }
                }
            })
            .then(() => value)
            .then(resolve)
            .catch(reject);
    });
};
