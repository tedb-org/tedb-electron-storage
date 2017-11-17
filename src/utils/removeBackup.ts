import {safeReadFile, UnlinkFile, RmDir, safeDirExists} from './index';
const path = require('path');

const unlinkAndRmDir = (file: string, dir: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return UnlinkFile(file)
            .then(() => RmDir(dir))
            .then(resolve)
            .catch(reject);
    });
};

const safeToRead = (dirLocation: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(dirLocation, 'past'))
            .then((dataBool) => {
                if (dataBool === false) {
                    return RmDir(dirLocation);
                } else {
                    return unlinkAndRmDir(path.join(dirLocation, 'past'), dirLocation);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

export const removeBackup = (dirLocation: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(dirLocation)
            .then((bool): Promise<null> => {
                if (bool === false) {
                    // dir does not exist anyway
                    return new Promise((res) => res());
                } else {
                    return safeToRead(dirLocation);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
