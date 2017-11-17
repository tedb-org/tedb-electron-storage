import {open} from 'fs';

export const OpenFile = (path: string | Buffer, flags: string | number, mode: number = 0o666): Promise<any> => {
    return new Promise((resolve, reject) => {
        open(path, flags, mode, (err, fd) => {
            if (err) {
                resolve(false);
                // return reject(new Error(':::Storage::: OpenFile Error. ' + err.message));
            } else {
                resolve(fd);
            }
        });
    });
};
