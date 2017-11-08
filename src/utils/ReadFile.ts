import {readFile, existsSync} from 'fs';

export interface IReadFileOptions {
    encoding?: string | null;
    flag?: string;
}

export const ReadFile = (path: string | Buffer | number, options?: IReadFileOptions): Promise<string | Buffer> => {
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
            return reject(new Error(`File Read Error: File ${path} does not exist.`));
        }
        readFile(path, Options, (err: any, data: string | Buffer) => {
            if (err) {
                return reject(err);
            } else {
                resolve(data);
            }
        });
    });
};
