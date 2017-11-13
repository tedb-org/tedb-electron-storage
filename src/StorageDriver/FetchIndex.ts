import {TElectronStorage} from './Driver';
import {existsSync} from 'fs';
import {RmDir, UnlinkFile, safeParse, ReadFile, CopyFile, stringifyJSON} from '../utils';
const path = require('path');

/**
 * Remove the backup file and the backup directory
 * base current file does not exist if this is called
 * @param {string} dir
 * @returns {Promise<any>}
 */
const deleteBackupFileAndDir = (dir: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        console.log(19)
        return UnlinkFile(path.join(dir, 'past'))
            .then(() => RmDir(dir))
            .then(resolve)
            .catch(reject);
    });
};

/**
 * The backup exists -> copy and move it over to the current location and resolve data
 * @param {string} key
 * @param {string} base
 * @param {string} dir
 * @param data
 * @returns {Promise<any>}
 */
const copyAndReturn = (key: string, base: string, dir: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        console.log(18)
        return CopyFile(path.join(dir, 'past'), path.join(base, `index_${key}.db`))
            .then(() => resolve(data))
            .catch(reject);
    });
};

const isBackupNull = (key: string, base: string, dir: string, data: any) => {
    return new Promise((resolve, reject) => {
        return stringifyJSON(data)
            .then((stringData) => {
                if (stringData === '[{"key":null,"value":[]}]') {
                    console.log(20)
                    // base is missing and backup is empty -> remove both
                    return deleteBackupFileAndDir(dir);
                } else {
                    console.log(21)
                    return copyAndReturn(key, base, dir, data);
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
 * @param {string} base
 * @param {string} dir
 * @param {string} key
 * @returns {Promise<any>}
 */
const testBackup = (base: string, dir: string, key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (existsSync(path.join(dir, 'past'))) {
            console.log(14)
            // read file to see if it is parsable, if not delete, if so
            // copy and write. and resolve
            return ReadFile(path.join(dir, 'past'))
                .then((rawData) => safeParse(rawData))
                .then((dataBool) => {
                    if (dataBool === false) {
                        console.log(15)
                        // delete and resolve
                        return deleteBackupFileAndDir(dir);
                    } else {
                        console.log(16)
                        // copy and write and return -> do not return '[{"key":null,"value":[]}]'
                        return isBackupNull(key, base, dir, dataBool);
                    }
                })
                .then(resolve)
                .catch(reject);
        } else {
            console.log(17)
            // remove the dir because 'past' does not exist and resolve
            return RmDir(dir)
                .then(resolve)
                .catch(reject);
        }
    });
};

/**
 * broken out remove all method
 * @param {string} base
 * @param {string} dir
 * @param {string} key
 * @returns {Promise<any>}
 * @constructor
 */
const RemoveAll = (base: string, dir: string, key: string): Promise<null> => {
    return new Promise((resolve, reject) => {
        console.log(13)
        return UnlinkFile(path.join(base, `index_${key}.db`))
            .then(() => deleteBackupFileAndDir(dir))
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Checking backup data because current data file is unparsable
 * Test if backup directory exists
 * if So -> check if backup file exists
 *      if So ->
 *          Readfile - parsedata - is readable
 *              if So -> copy contents to current and resolve data
 *              if Not -> remove base file - remove backup file - remove dir
 *      if Not -> remove backup dir - remove current file
 * if Not -> remove base current file
 * @param {string} base
 * @param {string} dir
 * @param {string} key
 * @returns {Promise<any>}
 */
const checkBackupAndReplace = (base: string, dir: string, key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (existsSync(dir)) {
            console.log(7)
            // backup exists
            if (existsSync(path.join(dir, 'past'))) {
                console.log(9)
                // backup file exists
                return ReadFile(path.join(dir, 'past'))
                    .then((rawData) => safeParse(rawData))
                    .then((dataBool) => {
                        if (dataBool === false) {
                            console.log(10)
                            // delete file and directory and base
                            return RemoveAll(base, dir, key);
                        } else {
                            console.log(11)
                            // data is found and parsable. write to base and resolve data
                            return copyAndReturn(key, base, dir, dataBool);
                        }
                    })
                    .catch(reject);
            } else {
                console.log(12)
                // backup does not exist - delete backup dir and base location
                return RmDir(dir)
                    .then(() => UnlinkFile(path.join(base, `index_${key}`)))
                    .then(resolve)
                    .catch(reject);
            }
        } else {
            console.log(8)
            // no backup dir - delete base
            return UnlinkFile(path.join(base, `index_${key}.db`))
                .then(resolve)
                .catch(reject);
        }
    });
};

/**
 * Test if current data location is readable
 * if So -> resolve data
 * if Not -> check backup data
 * @param {string} base
 * @param {string} dir
 * @param {string} key
 * @returns {Promise<any>}
 */
const testLocationAndReturn = (base: string, dir: string, key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        return ReadFile(path.join(base, `index_${key}.db`))
            .then((rawData) => safeParse(rawData))
            .then((dataBool) => {
                if (dataBool === false) {
                    console.log(5)
                    // file was unreadable. check backup. if exists replace and return
                    // else delete both and resolve
                    return checkBackupAndReplace(base, dir, key);
                } else {
                    console.log(6)
                    // parse data successfully, resolve
                    return new Promise((res) => res(dataBool));
                }
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * Base method
 * Test if the base file IE the current fie exists
 * if So -> test if the location is readable
 * if Not -> does the backup dir exist?
 *      if So -> test backup if readable
 *      if Not -> resolve nothing
 * @param {string} key
 * @param {TElectronStorage} Storage
 * @returns {Promise<any>}
 * @constructor
 */
export const FetchIndex = (key: string, Storage: TElectronStorage): Promise<any> => {
    return new Promise((resolve, reject) => {
        const baseLocation = Storage.collectionPath;
        const dirLocation = path.join(baseLocation, Storage.version, 'states', `index_${key}`);
        // check if exists
        if (existsSync(path.join(baseLocation, `index_${key}.db`))) {
            console.log(1)
            // base location was found.
            return testLocationAndReturn(baseLocation, dirLocation, key)
                .then(resolve)
                .catch(reject);
        } else {
            console.log(2)
            // check file location to see if the directory of backup exists
            if (existsSync(dirLocation)) {
                console.log(3)
                return testBackup(baseLocation, dirLocation, key)
                    .then(resolve)
                    .catch(reject);
            } else {
                console.log(4)
                // no directory found
                resolve();
            }
        }
    });
};
