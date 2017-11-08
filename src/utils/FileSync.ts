import {fsync} from 'fs';

export const FileSync = (fd: number): Promise<number> => {
    return new Promise((resolve, reject) => {
        fsync(fd, (err) => {
            if (err) {
                return reject(err);
            } else {
                resolve();
            }
        });
    });
};
