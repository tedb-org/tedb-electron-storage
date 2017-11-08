import {fsync} from 'fs';

export const FileSync = (fd: number): Promise<number> => {
    return new Promise((resolve, reject) => {
        fsync(fd, (err) => {
            if (err) {
                return reject(new Error(':::Storage::: FileSync Error.'));
            } else {
                resolve();
            }
        });
    });
};
