import {IStorageDriverExtended, Isanitize, Iexist} from '../types';
import {safeReadFile, safeParse, safeDirExists, RmDir, UnlinkFile} from '../utils';
const path = require('path');

const removeBackupDirAndFalse = (obj: Isanitize, dir: string, index: any, fieldName: string): Promise<Iexist> => {
    return new Promise((resolve, reject) => {
        return RmDir(dir)
            .then(() => resolve({key: obj.key, value: obj.value, doesExist: false, index, fieldName}))
            .catch(reject);
    });
};

const backUpFileAndDir = (obj: Isanitize, dir: string, index: any, fieldName: string): Promise<Iexist> => {
    return new Promise((resolve, reject) => {
        return UnlinkFile(path.join(dir, 'past'))
            .then(() => removeBackupDirAndFalse(obj, dir, index, fieldName))
            .then(resolve)
            .catch(reject);
    });
};

const readParsable = (obj: Isanitize, data: string, dir: string, base: string, index: any, fieldName: string): Promise<Iexist> => {
    return new Promise((resolve, reject) => {
        return safeParse(data)
            .then((databool): Promise<Iexist> => {
                if (databool === false) {
                    return backUpFileAndDir(obj, dir, index, fieldName);
                } else {
                    // return it is parsable -> no need to move over. the find will do that
                    return new Promise((res) => res({key: obj.key, value: obj.value, doesExist: true, index, fieldName}));
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const checkBackupFile = (obj: Isanitize, dir: string, base: string, index: any, fieldName: string): Promise<Iexist> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(dir, 'past'))
            .then((booldata): Promise<Iexist> => {
                if (booldata === false) {
                    return removeBackupDirAndFalse(obj, dir, index, fieldName);
                } else {
                    return readParsable(obj, booldata, dir, base, index, fieldName);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const readBackupRemoveParse = (obj: Isanitize, dir: string, base: string, index: any, fieldName: string): Promise<Iexist> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(dir)
            .then((bool): Promise<Iexist> => {
                if (bool === false) {
                    return new Promise((res) => res({key: obj.key, value: obj.value, doesExist: false, index, fieldName}));
                } else {
                    return checkBackupFile(obj, dir, base, index, fieldName);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

// Above is base did not exist ---------------------------------------------------

const readAndRemoveParse = (rawData: any, obj: Isanitize, index: any, fieldName: string): Promise<Iexist> => {
    return new Promise((resolve, reject) => {
        return safeParse(rawData)
            .then((dataBool): Promise<Iexist> => {
                if (dataBool === false) {
                    return new Promise((res) => res({key: obj.key, value: obj.value, doesExist: false, index, fieldName}));
                } else {
                    return new Promise((res) => res({key: obj.key, value: obj.value, doesExist: true, index, fieldName}));
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Should act as a find where if an item does not exist check the backup file
 * If the backup exists replace if parsable. If unparsable remove backup
 * and send back that the file does not exist.
 *
 * Should only remove files if intended to send back false
 * @param {Isanitize} obj
 * @param index
 * @param {string} fieldName
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<Iexist>}
 * @constructor
 */
export const Exists = (obj: Isanitize, index: any, fieldName: string, Storage: IStorageDriverExtended): Promise<Iexist> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const basePath = path.join(baseLocation, `${obj.value}.db`);
        const dirLoaction = path.join(baseLocation, Storage.version, 'states', `${obj.value}`);
        return safeReadFile(basePath)
            .then((databool): Promise<Iexist> => {
                if (databool === false) {
                    // check backup and parsable
                    return readBackupRemoveParse(obj, dirLoaction, baseLocation, index, fieldName);
                } else {
                    return readAndRemoveParse(databool, obj, index, fieldName);
                }
            })
            .then(resolve)
            .catch((err) => {
                return reject(new Error(':::Storage::: Exists Error. ' + err.message));
            });
    });
};
