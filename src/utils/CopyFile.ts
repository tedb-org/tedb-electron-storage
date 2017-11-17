import {safeReadFile, safeParse, EnsureDataFile, SafeWrite, parseJSON, stringifyJSON} from './index';

const continueOp = (dest: string, incomingData: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        let fileData: any;
        return safeParse(incomingData)
            .then((bool) => {
                if (bool === false) {
                    resolve();
                } else {
                    return parseJSON(incomingData)
                        .then((data) => stringifyJSON(data)) // convert back to string
                        .then((data) => {
                            fileData = data;
                            return EnsureDataFile(dest); // make sure destination exists before write
                        })
                        .then(() => SafeWrite(dest, fileData)) // write
                        .then(resolve)
                        .catch(reject);
                }
            })
            .catch(reject);
    });
};

export const CopyFile = (src: string, dest: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        safeReadFile(src, {encoding: 'utf8'})
            .then((dataBool) => {
                if (dataBool === false) {
                    return new Promise((res) => res());
                } else {
                    return continueOp(dest, dataBool);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
