import {safeDirExists, RmDir} from './index';

export const safeRmDir = (fileLocation: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        // remove the directory because 'past' does not exist and resolve.
        return safeDirExists(fileLocation)
            .then((bool): Promise<any> => {
                if (bool === false) {
                    // no dir found
                    return new Promise((res) => res());
                } else {
                    // remove dir
                    return RmDir(fileLocation);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
