import {ReadDir, RmDir, UnlinkFile, LStat} from './index';
const path = require('path');

const deleteFile = (dir: string, file: string | Buffer) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(dir, file);
        LStat(filePath)
            .then((stats) => {
                if (stats.isDirectory()) {
                    resolve(ClearDirectory(filePath));
                } else {
                    resolve(UnlinkFile(filePath));
                }
            })
            .catch((err) => {
                return reject(new Error(':::Storage::: deleteFile Error. ' + err.message));
            });
    });
};

export const ClearDirectory = (directory: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return ReadDir(directory)
            .then((files) => {
                return Promise.all(files.map((file) => {
                    return deleteFile(directory, file);
                }));
            })
            .then(() => {
                return RmDir(directory);
            })
            .then(resolve)
            .catch((err) => {
                return reject(new Error(':::Storage::: ClearDirectory Error. ' + err.message));
            });
    });
};
