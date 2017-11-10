import {rmdir} from 'fs';

export const RmDir = (path: string | Buffer): Promise<null> => {
    return new Promise((resolve, reject) => {
        rmdir(path, (err) => {
            if (err) {
                return reject(new Error(':::Storage::: RmDir Error.'));
            }
            resolve();
        });
    });
};