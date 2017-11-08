import {ReadFile, SafeWrite, parseJSON, stringifyJSON} from './index';

export const CopyFile = (src: string, dest: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ReadFile(src, {encoding: 'utf8'})
            .then((data) => parseJSON(data)) // Can it be converted to JSON
            .then((data) => stringifyJSON(data)) // convert back to string
            .then((data) => SafeWrite(dest, data)) // write
            .then(resolve)
            .catch(reject);
    });
};
