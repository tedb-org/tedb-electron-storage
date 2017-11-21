import {safeReadFile, safeParse, EnsureDataFile, SafeWrite} from './index';

const continueOp = (dest: string, incomingData: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeParse(incomingData)
            .then((booldata) => {
                if (booldata === false) {
                    resolve();
                } else {
                    return EnsureDataFile(dest)
                        .then(() => SafeWrite(dest, incomingData)) // write
                        .then(resolve)
                        .catch(reject);
                }
            })
            .catch((err) => {
                return reject(new Error(':::Storage::: continueOp Error. ' + err.message));
            });
    });
};

export const CopyFile = (src: string, dest: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(src)
            .then((dataBool) => {
                if (dataBool === false) {
                    return new Promise((res) => res());
                } else {
                    return continueOp(dest, dataBool);
                }
            })
            .then(resolve)
            .catch((err) => {
                return reject(new Error(':::Storage::: CopyFile Error. ' + err.message));
            });
    });
};
