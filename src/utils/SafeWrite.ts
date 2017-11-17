import {FlushStorage, IFlushStorageOptions, WriteFile, safeReadFile} from './index';
const path = require('path');

const safeFlush = (options: any, filename: string, data: any): Promise<null> => {
    return new Promise((resolve, reject) => {
        return FlushStorage(options)
            .then(() => FlushStorage(filename))
            .then(() => WriteFile(filename, data))
            .then(() => FlushStorage(filename))
            .then(() => FlushStorage(options))
            .then(resolve)
            .catch(reject);
    });
};

export const SafeWrite = (filename: string, data: string | Buffer | Uint8Array): Promise<null> => {
    return new Promise((resolve, reject) => {
        const options: IFlushStorageOptions = {
            filename: path.dirname(filename),
            isDir: true,
        };
        return safeReadFile(filename)
            .then((dataBool): Promise<null> => {
                if (dataBool === false) {
                    return new Promise((res) => res());
                } else {
                    return safeFlush(options, filename, data);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
