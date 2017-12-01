import {stat, Stats} from 'graceful-fs';
import ErrnoException = NodeJS.ErrnoException;

export const safeDirExists = (path: string | Buffer): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        stat(path, (err: ErrnoException, stats: Stats) => {
            if (err) {
                resolve(false);
            } else {
                resolve(stats.isDirectory());
            }
        });
    });
};
