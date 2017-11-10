import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {CreateBackupAndUnlink, UnlinkFile, RmDir} from '../utils';
const path = require('path');

const removeBackup = (fileLocation: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        if (!existsSync(path.join(fileLocation, 'past'))) {
            return resolve();
        } else {
            return UnlinkFile(fileLocation)
                .then(() => RmDir(fileLocation))
                .then(resolve)
                .catch(reject);
        }
    });
};

export const RemoveItem = (key: string, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(baseLocation, Storage.version, 'states', key);
        if (!existsSync(path.join(baseLocation, `${key}.db`))) {
            try {
                Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                // then check to see if backup exists -> if so remove it.
                return removeBackup(fileLocation)
                    .then(resolve)
                    .catch(reject);
            } catch (e) {
                return reject(e);
            }
        } else {
            return CreateBackupAndUnlink(fileLocation, path.join(baseLocation, `${key}.db`))
                .then(() => {
                    try {
                        Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                    } catch (e) {
                        throw e;
                    }
                    return null;
                })
                .then(resolve)
                .catch(reject);
        }
    });
};
