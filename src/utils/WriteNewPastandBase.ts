import {EnsureDataFile, SafeWrite, safeDirExists} from './index';
const path = require('path');

const writeNewDataToBaseAndBackup = (dir: string, base: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(dir, 'past'))
            .then(() => SafeWrite(path.join(dir, 'past'), data))
            .then(() => EnsureDataFile(base))
            .then(() => SafeWrite(base, data))
            .then(resolve)
            .catch(reject);
    });
};

export const WriteNewPastandBase = (fileLocation: string, baseLocation: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        // return EnsureDataFile(baseLocation)
        return safeDirExists(fileLocation)
            .then((bool) => {
                if (bool === false) {
                    return new Promise((res) => res());
                } else {
                    return writeNewDataToBaseAndBackup(fileLocation, baseLocation, data);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
