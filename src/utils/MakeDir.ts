import {mkdir} from 'fs';

export const MakeDir = (path: string | Buffer, mode: number = 0o777): Promise<null> => {
    return new Promise((resolve, reject) => {
        mkdir(path, mode, (err) => {
            if (err) {
                return reject(err);
            } else {
                resolve();
            }
        });
    });
};
