import {IStorageDriverExtended} from '../types';
import {safeReadFile, safeParse} from '../utils';
const path = require('path');

const readAndRemoveParse = (rawData: any, key: string, index: any, fieldName: string) => {
    return new Promise((resolve, reject) => {
        let resolveObj: any;
        return  safeParse(rawData)
            .then((dataBool) => {
                if (dataBool === false) {
                    resolveObj = {key, doesExist: false, index, fieldName};
                    return new Promise((res) => res());
                } else {
                    resolveObj = {key, doesExist: true, index, fieldName};
                    return new Promise((res) => res());
                }
            })
            .then(() => resolve(resolveObj))
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
                    // return readAndRemovePossible(basePath, key, index, fieldName, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
        /*return safeStat(basePath)
            .then((boolStat) => {
                if (boolStat === false) {
                    return new Promise((res) => res({key, doesExist: false, index, fieldName}));
                } else {
                    return readAndRemovePossible(basePath, key, index, fieldName, Storage);
                }
            })
            .then(resolve)
            .catch(reject);*/
    });
};
