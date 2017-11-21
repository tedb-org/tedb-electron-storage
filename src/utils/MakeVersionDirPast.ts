import {MakeDir} from './index';

/**
 * Main Method
 * Since the past directory does not exist a need to create the directory before writing is needed
 * @param {string} fileLocation
 * @param returnMany
 * @param {string} data
 * @returns {Promise<any>}
 * @constructor
 */
export const MakeVersionDirPast = (fileLocation: string, returnMany: any, data: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return MakeDir(fileLocation)
            .then(() => returnMany(data))
            .then(resolve)
            .catch((err) => {
                return reject(new Error(':::Storage::: MakeVersionDirPast Error. ' + err.message));
            });
    });
};
