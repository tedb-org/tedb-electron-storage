import {existsSync} from 'fs';
import {WriteFile} from './WriteFile';
import ErrnoException = NodeJS.ErrnoException;

export const EnsureDataFile = (filename: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        if (existsSync(filename)) {
            return resolve();
        } else {
            return WriteFile(filename, '')
                .then(resolve)
                .catch((err: ErrnoException) => {
                    return reject(new Error(':::Storage::: EnsureDataFile Error'));
                });
        }
    });
};
