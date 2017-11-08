import {fstat, Stats} from 'fs';

export const FileStat = (fd: number): Promise<Stats> => {
    return new Promise((resolve, reject) => {
        fstat(fd, (err, stats) => {
            if (err) {
                return reject(err);
            } else {
                resolve(stats);
            }
        });
    });
};
