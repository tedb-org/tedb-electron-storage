import {IStorageDriverExtended} from '../types';
import {safeParse, UnlinkFile, safeReadFile, RmDir, CopyFile, safeDirExists} from '../utils';
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
            .then(() => RmDir(fileLocation))
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

const rmDir = (fileLocation: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
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
            .then(() => {
                Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                resolve();
            })
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
                    return rmDir(fileLocation, key, Storage);
                } else {
                    // file was found
                    return testBackupParse(databool, baseLocation, fileLocation, key, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
        /*if (existsSync(path.join(fileLocation, 'past'))) {
            // read file to see if it is parsable, if not delete, if so
            // copy and write. and resolve.
            return ReadFile(path.join(fileLocation, 'past'))
                .then((rawData) => safeParse(rawData))
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
        } else {
            // remove the directory because 'past' does not exist and resolve.
            return RmDir(fileLocation)
                .then(() => {
                    Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                    resolve();
                })
                .catch(reject);
        }*/
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

const unlinkandDir = (base: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
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

const readBackupFilesTestPARSE = (rawData: any, base: string, backup: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeParse(rawData)
        .then((dataBool) => {
            if (dataBool === false) {
                // delete file and directory and base location and resolve.
                // remove key from list
                return UnlinkFile(path.join(base, `${key}.db`))
                    .then(() => UnlinkFile(path.join(backup, 'past')))
                    .then(() => RmDir(backup))
                    .then(() => {
                        Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                        resolve();
                    })
                    .catch(reject);
            } else {
                // data is found and parsable. write to base and resolve data
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
                    return unlinkandDir(base, key, Storage);
                } else {
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
        /*if (existsSync(backup)) {
            // dir exists
            if (existsSync(path.join(backup, 'past'))) {
                // backup file exists
                return ReadFile(path.join(backup, 'past'))
                    .then((rawData) => safeParse(rawData))
                    .then((dataBool) => {
                        if (dataBool === false) {
                            // delete file and directory and base location and resolve.
                            // remove key from list
                            return UnlinkFile(path.join(base, `${key}.db`))
                                .then(() => UnlinkFile(path.join(backup, 'past')))
                                .then(() => RmDir(backup))
                                .then(() => {
                                    Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                                    resolve();
                                })
                                .catch(reject);
                        } else {
                            // data is found and parsable. write to base and resolve data
                            return copyAndReturn(key, base, backup, dataBool);
                        }
                    })
                    .then(resolve)
                    .catch(reject);
            } else {
                // backup does not exist
                return RmDir(backup)
                    .then(() => UnlinkFile(path.join(base, `${key}.db`)))
                    .then(() => {
                        Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                        resolve();
                    })
                    .catch(reject);
            }
        } else {
            // delete base and remove key from all keys
            return UnlinkFile(path.join(base, `${key}.db`))
                .then(() => {
                    Storage.allKeys = Storage.allKeys.filter((cur) => cur !== key);
                    resolve();
                })
                .catch(reject);
        }*/
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

/**
 * Test if current data location is readable.
 * if So -> resolve the data
 * if Not -> Check backup data
 * @param {string} base
 * @param {string} backup
 * @param {string} key
 * @param {IStorageDriverExtended} Storage
 * @returns {Promise<any>}
 */
const testLocationAndReturn = (base: string, backup: string, key: string, Storage: IStorageDriverExtended): Promise<any> => {
    return new Promise((resolve, reject) => {
        return safeReadFile(path.join(base, `${key}.db`))
            .then((databool) => {
                if (databool === false) {
                    return checkBackupAndReplace(base, backup, key, Storage);
                } else {
                    return testLocationAndReturnParse(databool, base, backup, key, Storage);
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
                    Storage.allKeys = [...Storage.allKeys.filter((cur) => cur !== key)];
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
                    return testLocationAndReturn(baseLocation, fileLocation, key, Storage);
                }
            })
            .then(resolve)
            .catch(reject);
        /*if (existsSync(path.join(baseLocation, `${key}.db`))) {
            // base location was found.
            return testLocationAndReturn(baseLocation, fileLocation, key, Storage)
                .then(resolve)
                .catch(reject);
        } else {
            // check file location to see if the directory exists.
            if (existsSync(fileLocation)) {
                return testBackup(baseLocation, fileLocation, key, Storage)
                    .then(resolve)
                    .catch(reject);
            } else {
                // no directory or file was found. resolve
                resolve();
            }
        }*/
    });
};
