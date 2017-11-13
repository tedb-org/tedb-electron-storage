import {existsSync} from 'fs';
import {UnlinkFile, RmDir} from './index';
const path = require('path');

export const removeBackup = (dirLocation: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        if (!existsSync(dirLocation)) {
            return resolve();
        } else {
            if (!existsSync(path.join(dirLocation, 'past'))) {
                return RmDir(dirLocation)
                    .then(resolve)
                    .catch(reject);
            } else {
                return UnlinkFile(path.join(dirLocation, 'past'))
                    .then(() => RmDir(dirLocation))
                    .then(resolve)
                    .catch(reject);
            }
        }
    });
};
