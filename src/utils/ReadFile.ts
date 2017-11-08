import {readFile, existsSync} from 'fs';
import ErrnoException = NodeJS.ErrnoException;

export interface IReadFileOptions {
    encoding?: string | null;
    flag?: string;
}

export const ReadFile = (path: string, options?: IReadFileOptions): Promise<string> => {
    return new Promise((resolve, reject) => {
        const Options: IReadFileOptions = {};
        if (!options) {
            Options.encoding = null;
            Options.flag = 'r';
        } else {
            if (!options.encoding) {
                Options.encoding = null;
            }
            if (!options.flag) {
                Options.flag = 'r';
            }
        }
        if (!existsSync(path)) {
            return reject(new Error(`:::Storage::: ReadFile Error: trying to read a file that does not exist.`));
        }
        readFile(path, Options, (err: ErrnoException, data: string | Buffer) => {
            if (err) {
                return reject(new Error(':::Storage::: ReadFile Error.'));
            } else {
                data = data as string;
                resolve(data);
            }
        });
    });
};
