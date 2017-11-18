import {EnsureDataFile, SafeWrite} from './index';
const path = require('path');

/**
 * Main method
 * Write data to past and current location
 * @param {string} fileLocation
 * @param {any} returnMany
 * @param {string} baseLocation
 * @param data
 * @returns {Promise<any>}
 * @constructor
 */
export const WriteNewPastandBase = (fileLocation: string, returnMany: any, baseLocation: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(fileLocation, 'past'))
            .then(() => SafeWrite(path.join(fileLocation, 'past'), data))
            .then(() => EnsureDataFile(baseLocation))
            .then(() => SafeWrite(baseLocation, data))
            .then(resolve)
            .catch(reject);
    });
};
