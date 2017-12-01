import {IStorageDriverExtended} from '../types';
import {safeReadFile, safeParse} from '../utils';
const path = require('path');

const readAndRemoveParse = (rawData: any, key: string, index: any, fieldName: string) => {
    return new Promise((resolve, reject) => {
        return safeParse(rawData)
            .then((dataBool) => {
                if (dataBool === false) {
                    return new Promise((res) => res({key, doesExist: false, index, fieldName}));
                } else {
                    return new Promise((res) => res({key, doesExist: true, index, fieldName}));
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

export const Exists = (key: string, index: any, fieldName: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const basePath = path.join(Storage.collectionPath, `${key}.db`);
        return safeReadFile(basePath)
            .then((databool) => {
                if (databool === false) {
                    return new Promise((res) => res({key, doesExist: false, index, fieldName}));
                } else {
                    return readAndRemoveParse(databool, key, index, fieldName);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
