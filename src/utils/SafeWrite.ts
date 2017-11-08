import {FlushStorage, IFlushStorageOptions, WriteFile} from './index';
import {existsSync} from 'fs';
const path = require('path');

export const SafeWrite = (filename: string, data: string | Buffer | Uint8Array): Promise<null> => {
    return new Promise((resolve, reject) => {
        const options: IFlushStorageOptions = {
            filename: path.dirname(filename),
            isDir: true,
        };

        if (!existsSync(filename)) {
            return reject(new Error(`SafeWrite Error: No file named ${filename} to write to`));
        } else {
            return FlushStorage(options)
                .then(() => FlushStorage(filename))
                .then(() => WriteFile(filename, data))
                .then(() => FlushStorage(filename))
                .then(() => FlushStorage(options))
                .then(resolve)
                .catch(reject);
        }
    });
};
