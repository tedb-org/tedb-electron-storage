import {CloseFile, OpenFile, ReadFile, safeStat} from './index';

export interface IsafeReadFileOptions {
    encoding?: string | null;
    flag?: string;
}

export const safeReadFile = (path: string, options?: IsafeReadFileOptions): Promise<any> => {
    return new Promise((resolve, reject) => {
        let fd: number;
        let data: any;
        return OpenFile(path, 'r')
            .then((fdbool) => {
                if (fdbool === false) {
                    // file does not exist
                    return new Promise((res) => res(false));
                } else {
                    fd = fdbool;
                    return ReadFile(fd);
                }
            })
            .then((databool) => {
                if (databool === false) {
                    return new Promise((res) => res(false));
                } else {
                    data = databool;
                    return CloseFile(fd);
                }
            })
            .then((bool) => {
                if (bool === false) {
                    resolve(false);
                } else {
                    resolve(data);
                }
            })
            .catch(reject);
    });
};

/*export const safeReadFile = (path: string, options?: IsafeReadFileOptions): Promise<any> => {
    return new Promise((resolve, reject) => {
        const Options: IsafeReadFileOptions = {};
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
        readFile(path, Options, (err: ErrnoException, data: string | Buffer) => {
            if (err) {
                console.log(JSON.stringify(err));
                resolve(false);
            } else {
                data = data as string;
                resolve(data);
            }
        });
    });
};*/
