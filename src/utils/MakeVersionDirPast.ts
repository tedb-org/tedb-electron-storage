import {MakeDir, safeReadFile, OpenFile, safeDirExists} from './index';

const mkdirAndSet = (fileLocation: string, returnMany: any, data: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return MakeDir(fileLocation)
            .then(() => returnMany(data))
            .then(resolve)
            .catch(reject);
    });
};

export const MakeVersionDirPast = (fileLocation: string, returnMany: any, data: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(fileLocation)
            .then((databool: any) => {
                if (databool === false) {
                    return mkdirAndSet(fileLocation, returnMany, data);
                } else {
                    return returnMany(data);
                }
            })
            .then(resolve)
            .catch(reject);
        /*return MakeDir(fileLocation)
            .then(() => returnMany(data))
            .then(resolve)
            .catch(reject);*/
    });
};
