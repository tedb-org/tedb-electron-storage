import {readdir} from 'graceful-fs';

export const ReadDir = (path: string | Buffer): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        readdir(path, {encoding: 'utf8'}, (err, files: string[]) => {
            if (err) {
                return reject(new Error(':::Storage::: ReadDir Error. ' + err.message));
            } else {
                resolve(files);
            }
        });
    });
};
