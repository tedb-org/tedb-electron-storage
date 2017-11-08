import {copyFile} from 'fs';

export const CopyFile = (src: string | Buffer, dest: string| Buffer, flags: number = 0): Promise<null> => {
    return new Promise((resolve, reject) => {
        copyFile(src, dest, flags, (err) => {
            if (err) {
                return reject(err);
            } else {
                resolve();
            }
        });
    });
};
