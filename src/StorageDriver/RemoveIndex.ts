import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {CreateBackupAndUnlink} from '../utils';
const path = require('path');

export const RemoveIndex = (key: string, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(baseLocation, Storage.version, 'states', key);
        if (!existsSync(path.join(baseLocation, `index_${key}.db`))) {
            return resolve();
        } else {
            return CreateBackupAndUnlink(fileLocation, path.join(baseLocation, `index_${key}.db`))
                .then(resolve)
                .catch(reject);
        }
    });
};
