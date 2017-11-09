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

        return OpenFile(filename, flags, undefined)
            .then(FileSync)
            .then(CloseFile)
            .then(resolve)
            .catch((err) => {
                reject(new Error(':::Storage::: FlushStorage Error. ' + err.message));
            });
    });
};
