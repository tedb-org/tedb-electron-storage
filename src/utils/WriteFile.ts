import {writeFile} from 'fs';

export interface IWriteFileOptions {
    encoding?: string | null;
    mode?: number;
    flag?: string;
}

export const WriteFile = (file: string | Buffer | number, data: string | Buffer | Uint8Array, options?: IWriteFileOptions): Promise<null> => {
    return new Promise((resolve, reject) => {
        const Options: IWriteFileOptions = {};
        if (!options) {
            Options.encoding = 'utf8';
            Options.mode = 0o666;
            Options.flag = 'w';
        } else {
            if (!options.encoding) {
                Options.encoding = 'utf8';
            }
            if (!options.mode) {
                Options.mode = 0o666;
            }
            if (!options.flag) {
                Options.flag = 'w';
            }
        }
        writeFile(file, data, Options, (err) => {
            if (err) {
                return reject(err);
            } else {
                resolve();
            }
        });
    });
};
