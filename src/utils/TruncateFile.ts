import {ftruncate} from 'fs';

export const TruncateFile = (fd: number, len: number): Promise<null> => {
    return new Promise((resolve, reject) => {
        ftruncate(fd, len, (err) => {
            if (err) {
                return reject(err);
            } else {
                resolve();
            }
        });
    });
};
