import {readdir} from 'fs';

export const ReadDir = (path: string | Buffer, encoding: string = 'utf8'): Promise<Array<string | Buffer>> => {
    return new Promise((resolve, reject) => {
        readdir(path, encoding, (err, files) => {
            if (err) {
                return reject(new Error(':::Storage::: ReadDir Error.'));
            }
            resolve(files);
        });
    });
};
