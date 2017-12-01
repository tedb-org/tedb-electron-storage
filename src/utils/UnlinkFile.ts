import {unlink} from 'graceful-fs';

export const UnlinkFile = (path: string | Buffer): Promise<null> => {
    return new Promise((resolve, reject) => {
        unlink(path, (err) => {
            if (err) {
                resolve();
            } else {
                resolve();
            }
        });
    });
};
