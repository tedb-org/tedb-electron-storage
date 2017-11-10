import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {ReadDir, ReadFile, parseJSON} from '../utils';
const path = require('path');

// not tested
const readParseIterate = (filename: string, iterator: (key: string, value: any) => any) => {
    return new Promise((resolve, reject) => {
        return ReadFile(filename)
            .then((data) => parseJSON(data))
            .then((data) => {
                if (data.hasOwnProperty('_id')) {
                    resolve(iterator(data, data._id));
                }
                resolve();
            })
            .catch(reject);
    });
};

export const Iterate = (iteratorCallback: (key: string, value: any, iteratorNumber?: number) => any, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        if (!existsSync(baseLocation)) {
            return reject(`:::Storage::: No directory at ${baseLocation}`);
        } else {
            return ReadDir(baseLocation)
                .then((files) => {
                    return Promise.all(files.map((file) => {
                        const filename = path.join(baseLocation, file);
                        return readParseIterate(filename, iteratorCallback);
                    }));
                })
                .then(resolve)
                .catch(reject);
        }
    });
};
