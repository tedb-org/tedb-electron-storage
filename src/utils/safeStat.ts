import {stat, Stats} from 'graceful-fs';
import ErrnoException = NodeJS.ErrnoException;

export const safeStat = (path: string | Buffer): Promise<Stats | boolean> => {
    return new Promise((resolve, reject) => {
        try {
            stat(path, (err: ErrnoException, stats: Stats) => {
                if (err) {
                    // for missing file
                    if (err.errno === -2 && err.code === 'ENOENT' && err.syscall === 'stat') {
                        resolve(false);
                    } else {
                        return reject(err);
                    }
                } else {
                    resolve(stats);
                }
            });
        } catch (e) {
            return reject(e);
        }
    });
};
