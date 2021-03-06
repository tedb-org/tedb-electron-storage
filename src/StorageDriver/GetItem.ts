import {IStorageDriverExtended} from '../types';
import {safeParse, UnlinkFile, safeReadFile, CopyFile, safeDirExists, safeRmDir} from '../utils';
const path = require('path');

/*
* Trying to retrieve an item should not reject. simply resolve with nothing.
* Unless of course an operation working to get the item fails.
* */

/**
 * Remove the backup file and the backup directory - remove key from db
 * base current file does not exist if this is called
 * @param {string} fileLocation
 * @param {string} key
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 */
const deleteBackupFileAndDir = (fileLocation: string, key: string, Storage: IStorageDriverExtended): Promise<null> => {
    return new Promise((resolve, reject) => {
        return UnlinkFile(path.join(fileLocation, 'past'))
            .then(() => safeRmDir(fileLocation))
            .then(() => {
                Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                resolve();
            })
            .catch(reject);
    });
};

/**
 * The backup exists -> copy and move it over to the current location and resolve data
 * @param {string} key
 * @param {string} base
 * @param {string} backup
 * @param data
 * @returns {Promise<any>}
 */
const copyAndReturn = (key: string, base: string, backup: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        // src, dest
        return CopyFile(path.join(backup, 'past'), path.join(base, `${key}.db`))
            .then(() => resolve(data))
            .catch(reject);
    });
};

const testBackupParse = (rawData: any, baseLocation: string, fileLocation: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeParse(rawData)
            .then((dataBool) => {
                if (dataBool === false) {
                    // delete and resolve
                    return deleteBackupFileAndDir(fileLocation, key, Storage);
                } else {
                    // copy and write and return
                    return copyAndReturn(key, baseLocation, fileLocation, dataBool);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Test if the backup file exists
 * if So -> Test if readable and - parse - if parsable copy over to base else remove
 * if Not -> Remove directory and remove key resolve nothing
 * @param {string} baseLocation - current data
 * @param {string} fileLocation - past data
 * @param {string} key
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 */
const testBackup = (baseLocation: string, fileLocation: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(fileLocation, 'past'))
            .then((databool) => {
                if (databool === false ) {
                    // file does not exist remove key and directory
                    return unlinkeAndDir(baseLocation, fileLocation, key, Storage);
                } else {
                    // file was found
                    return testBackupParse(databool, baseLocation, fileLocation, key, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const unlinkStorage = (base: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        // delete base and remove key from all keys
        return UnlinkFile(path.join(base, `${key}.db`))
            .then(() => {
                Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                resolve();
            })
            .catch(reject);
    });
};

const unlinkAll = (base: string, backup: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        // remove backup dir and current base file
        return deleteBackupFileAndDir(backup, key, Storage)
            .then(() => UnlinkFile(path.join(base, `${key}.db`)))
            .then(resolve)
            .catch(reject);
    });
};

const unlinkeAndDir = (base: string, backup: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return UnlinkFile(path.join(base, `${key}.db`))
            .then(() => safeRmDir(backup))
            .then(() => {
                Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                resolve();
            })
            .catch(reject);
    });
};

const readBackupFilesTestPARSE = (rawData: any, base: string, backup: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeParse(rawData)
        .then((dataBool) => {
            if (dataBool === false) {
                // delete file and directory and base location and resolve.
                // remove key from list
                return unlinkAll(base, backup, key, Storage);
            } else {
                // data is found and parsable in backup. write to base and resolve data
                return copyAndReturn(key, base, backup, dataBool);
            }
        })
            .then(resolve)
            .catch(reject);
    });
};

const readBackupFileTest = (backup: string, base: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(backup, 'past'))
            .then((databool) => {
                if (databool === false) {
                    // current file exists but unparsable. backup dir exists
                    // but backup file does not.
                    return unlinkeAndDir(base, backup, key, Storage);
                } else {
                    // current file exists - unparsable, bakcup file exists
                    return readBackupFilesTestPARSE(databool, base, backup, key, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Checking backup data because current data file is unparsable
 * Test if backup directory exists
 * if So -> check if backup file exists
 *      if So ->
 *          readFile - parseData - is Readable?
 *          if So -> Copy contents to current and resolve data
 *          if Not -> Remove base file - remove backup file - remove dir - remove key
 *      if Not -> remove backup dir - remove current data file - remove key
 * if Not -> Remove base current file and remove key from db
 * @param {string} base
 * @param {string} backup
 * @param {string} key
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 */
const checkBackupAndReplace = (base: string, backup: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(backup)
            .then((bool) => {
                if (bool === false) {
                    return unlinkStorage(base, key, Storage);
                } else {
                    return readBackupFileTest(backup, base, key, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const testLocationAndReturnParse = (rawData: any, base: string, backup: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeParse(rawData)
            .then((dataBool): Promise<any> => {
                if (dataBool === false) {
                    // file was unreadable. Check backup. if exists replace and return
                    // else delete both and resolve
                    return checkBackupAndReplace(base, backup, key, Storage);
                } else {
                    // parsed data successfully, resolve it
                    return new Promise((res) => res(dataBool));
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

const testFileLocation = (fileLocation: string, baseLocation: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeDirExists(fileLocation)
            .then((bool) => {
                if (bool === false) {
                    // dir does not exist  and base key was not found remove key
                    Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                    return new Promise((res) => res());
                } else {
                    // backup dir was found
                    return testBackup(baseLocation, fileLocation, key, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Base method
 * Test if the base file IE the current file exists
 * if So -> test if the location is readable
 * if Not -> does the backup dir exist?
 *  if So -> test backup if readable
 *  if Not -> resolve nothing
 * @param {string} key
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 * @constructor
 */
export const GetItem = (key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const fileLocation = path.join(baseLocation, Storage.version, 'states', key);
        // check if exists
        return safeReadFile(path.join(baseLocation, `${key}.db`))
            .then((databool) => {
                if (databool === false) {
                    // check backup
                    return testFileLocation(fileLocation, baseLocation, key, Storage);
                } else {
                    // base location was found.
                    return testLocationAndReturnParse(databool, baseLocation, fileLocation, key, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
