import {EnsureDataFile, CopyFile, UnlinkFile} from '../utils';
const path = require('path');

export const CreateBackupAndUnlink = (fileLocation: string, baseLocation: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        return EnsureDataFile(path.join(fileLocation, 'past'))
            .then(() => CopyFile(baseLocation, path.join(fileLocation, 'past')))
            .then(() => UnlinkFile(baseLocation))
            .then(resolve)
            .catch(reject);
    });
};
