import {readFile} from 'graceful-fs';

export interface IsafeReadFileOptions {
    encoding?: string | null;
    flag?: string;
}

export const safeReadFile = (path: string, options?: IsafeReadFileOptions): Promise<any> => {
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
        readFile(path, Options, (err: any, data: string | Buffer) => {
            if (err) {
                resolve(false);
            } else {
                data = data as string;
                resolve(data);
            }
        });
    });
};
