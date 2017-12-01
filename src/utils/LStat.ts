import {lstat, Stats} from 'graceful-fs';

export const LStat = (path: string | Buffer): Promise<Stats> => {
    return new Promise((resolve, reject) => {
        lstat(path, (err, stats) => {
            if (err) {
                return reject(new Error(':::Storage::: LStat Error. ' + err.message));
            }
            resolve(stats);
        });
    });
};
