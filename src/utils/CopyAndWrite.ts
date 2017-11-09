import {CopyFile, EnsureDataFile, SafeWrite} from './index';
const path = require('path');

export const CopyAndWrite = (fileLocation: string, baseLocation: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return CopyFile(baseLocation, path.join(fileLocation, 'past'))
            .then(() => EnsureDataFile(baseLocation))
            .then(() => SafeWrite(baseLocation, data))
            .then(resolve)
            .catch(reject);
    });
};
