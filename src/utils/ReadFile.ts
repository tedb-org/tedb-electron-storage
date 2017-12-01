import {readFile, Stats} from 'graceful-fs';
import {IsafeReadFileOptions} from './index';
import ErrnoException = NodeJS.ErrnoException;

export const ReadFile = (path: string, stats: Stats, options?: IsafeReadFileOptions): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        const Options: IsafeReadFileOptions = {};
        if (!options) {
            Options.encoding = 'utf8';
            Options.flag = 'r';
        } else {
            if (!options.encoding) {
                Options.encoding = 'utf8';
            }
            if (!options.flag) {
                Options.flag = 'r';
            }
        }
        readFile(path, Options, (err: ErrnoException, data: string | Buffer) => {
            if (err) {
                return reject(new Error(':::Storage::: ReadFile Error. ' + err.message));
            } else {
                data = data as string;
                resolve(data);
            }
        });
    });
};
