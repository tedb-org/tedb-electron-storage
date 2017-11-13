import {ReadFile, EnsureDataFile, SafeWrite, parseJSON, stringifyJSON} from './index';

export const CopyFile = (src: string, dest: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        let fileData: any;
        ReadFile(src, {encoding: 'utf8'})
            .then((data) => parseJSON(data)) // Can it be converted to JSON
            .then((data) => stringifyJSON(data)) // convert back to string
            .then((data) => {
                fileData = data;
                return EnsureDataFile(dest); // make sure destination exists before write
            })
            .then(() => SafeWrite(dest, fileData)) // write
            .then(resolve)
            .catch(reject);
    });
};
