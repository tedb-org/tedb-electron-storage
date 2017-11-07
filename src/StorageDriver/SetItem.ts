import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
const path = require('path');

export const SetItem = (key: string, value: any, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (!existsSync(path.join(Storage.collectionPath, `${key}.db`))) {
            // this file does exist.
        } else {
            // there was no file make for this item so there needs to be a directory

            // is there a directory fo the key? maybe
        }
    });
};
