import {CopyFile, SafeWrite} from './index';

/**
 * Used to copy a file and then write to the src new data.
 * @param {string} dest
 * @param {string} src
 * @param data
 * @returns {Promise<any>}
 * @constructor
 */
export const CopyAndWrite = (src: string, dest: string,  data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return CopyFile(src, dest)
            .then(() => SafeWrite(src, data))
            .then(resolve)
            .catch(reject);
    });
};
