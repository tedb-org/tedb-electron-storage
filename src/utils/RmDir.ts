import {rmdir} from 'graceful-fs';

export const RmDir = (path: string | Buffer): Promise<null> => {
    return new Promise((resolve, reject) => {
        rmdir(path, (err) => {
            if (err) {
                return reject(new Error(':::Storage::: RmDir Error. ' + err.message));
            } else {
                resolve();
            }
        });
    });
};
