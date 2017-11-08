import {close} from 'fs';

export const CloseFile = (fd: number): Promise<null> => {
    return new Promise((resolve, reject) => {
        close(fd, (err) => {
            if (err) {
                return reject(err);
            } else {
                resolve();
            }
        });
    });
};
