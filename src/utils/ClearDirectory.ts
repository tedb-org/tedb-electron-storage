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
            .catch(reject);
    });
};

export const ClearDirectory = (directory: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        ReadDir(directory)
            .then((files) => {
                return Promise.all(files.map((file) => {
                    return deleteFile(directory, file);
                }));
            })
            .then(() => {
                return RmDir(directory);
            })
            .then(resolve)
            .catch(reject);
    });
};
