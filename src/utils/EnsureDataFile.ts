import {WriteFile, safeReadFile} from './index';
import ErrnoException = NodeJS.ErrnoException;

const simpleWrite = (filename: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return WriteFile(filename, '')
            .then(resolve)
            .catch((err: ErrnoException) => {
                return reject(new Error(':::Storage::: simpleWrite Error. ' + err.message));
            });
    });
};

export const EnsureDataFile = (filename: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(filename)
            .then((dataBool): Promise<null> => {
                if (dataBool === false) {
                    return simpleWrite(filename);
                } else {
                    return new Promise((res) => res());
                }
            })
            .then(resolve)
            .catch((err) => {
                return reject(new Error(':::Storage::: EnsureDataFile Error. ' + err.message));
            });
    });
};
