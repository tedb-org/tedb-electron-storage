import {FileSync, OpenFile, CloseFile} from './index';

export interface IFlushStorageOptions {
    filename: string;
    isDir: boolean;
}
const win64: any = 'win64';

export const FlushStorage = (options: string | IFlushStorageOptions): Promise<null> => {
    return new Promise((resolve, reject) => {
        let filename;
        let flags;
        if (Object.prototype.toString.call(options) === '[object String]') {
            filename = options as string | Buffer;
            flags = 'r+';
        } else {
            options = options as IFlushStorageOptions;
            filename = options.filename as string | Buffer;
            flags = options.isDir ? 'r' : 'r+';
        }

        if (flags === 'r' && (process.platform === 'win32' || process.platform === win64)) {
            return resolve();
        }

        let fileDesc: number;
        return OpenFile(filename, flags)
            .then((fd) => {
                if (fd === false) {
                    return new Promise((res) => res(false));
                } else {
                    fileDesc = fd;
                    return FileSync(fd);
                }
            })
            .then((res): Promise<null> => {
                if (res === false) {
                    return new Promise((r) => r());
                } else {
                    return CloseFile(fileDesc);
                }
            })
            .then(resolve)
            .catch((err: any) => {
                reject(new Error(':::Storage::: FlushStorage Error. ' + err.message));
            });
    });
};
