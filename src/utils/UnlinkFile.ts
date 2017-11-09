import {unlink} from 'fs';

export const UnlinkFile = (path: string | Buffer): Promise<null> => {
    return new Promise((resolve, reject) => {
        unlink(path, (err) => {
            if (err) {
                return reject(new Error(':::Storage::: UnlinkFile Error.'));
            } else {
                resolve();
            }
        });
    });
};
