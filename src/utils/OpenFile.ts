import {open} from 'graceful-fs';

export const OpenFile = (path: string | Buffer, flags: string | number, mode: number = 0o666): Promise<any> => {
    return new Promise((resolve, reject) => {
        open(path, flags, mode, (err, fd) => {
            if (err) {
                resolve(false);
            } else {
                resolve(fd);
            }
        });
    });
};
