import {EnsureDataFile, SafeWrite, } from './index';
const path = require('path');

export const WriteNewPasteandBase = (fileLocation: string, baseLocation: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(baseLocation)
            .then(() => SafeWrite(baseLocation, data))
            .then(() => EnsureDataFile(path.join(fileLocation, 'past')))
            .then(() => SafeWrite(path.join(fileLocation, 'past'), data))
            .then(resolve)
            .catch(reject);
    });
};
