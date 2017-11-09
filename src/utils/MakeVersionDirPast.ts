import {MakeDir} from './index';

export const MakeVersionDirPast = (fileLocation: string, returnMany: any, data: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return MakeDir(fileLocation)
            .then(() => returnMany(data))
            .then(resolve)
            .catch(reject);
    });
};
