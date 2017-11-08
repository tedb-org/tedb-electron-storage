import {appendFile} from 'fs';

export interface IAppendFileOptions {
    encoding?: string | null;
    mode?: number;
    flag?: string;
}

export const AppendFile = (file: string | Buffer | number, data: string | Buffer, options?: IAppendFileOptions): Promise<null> => {
    return new Promise((resolve, reject) => {
        const Options: IAppendFileOptions = {};
        if (!options) {
            Options.encoding = 'utf8';
            Options.mode = 0o666;
            Options.flag = 'a';
        } else {
            if (!options.encoding) {
                Options.encoding = 'utf8';
            }
            if (!options.mode) {
                Options.mode = 0o666;
            }
            if (!options.flag) {
                Options.flag = 'a';
            }
        }
        appendFile(file, data, Options, (err) => {
            if (err) {
                reject(new Error(':::Storage::: AppendFile Error'));
            } else {
                resolve();
            }
        });
    });
};
