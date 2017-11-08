import {open} from 'fs';

export const OpenFile = (path: string | Buffer, flags: string | number, mode: number = 0o666): Promise<number> => {
    return new Promise((resolve, reject) => {
        open(path, flags, mode, (err, fd) => {
            if (err) {
                return reject(err);
            } else {
                resolve(fd);
            }
        });
    });
};
