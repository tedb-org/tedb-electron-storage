import {ftruncate} from 'fs';

export const TruncateFile = (fd: number, len: number): Promise<null> => {
    return new Promise((resolve, reject) => {
        ftruncate(fd, len, (err) => {
            if (err) {
                return reject(new Error(':::Storage::: TruncateFile Error. ' + err.message));
            } else {
                resolve();
            }
        });
    });
};
