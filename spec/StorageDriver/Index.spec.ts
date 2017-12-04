import {Datastore, IDatastore, Index} from 'tedb';
import {ElectronStorage} from '../../src/StorageDriver';
import {IStorageDriverExtended} from '../../src/types';
import {AppDirectory} from '../../src/AppDirectory';
import {ClearDirectory} from '../../src/utils';
import {existsSync, readFileSync} from 'graceful-fs';
const path = require('path');

let Storage: IStorageDriverExtended;
let DB: IDatastore;
let dbAppname: string;
let dbName: string;
beforeAll(() => {
    dbAppname = 'tedb-electron-storage-index';
    dbName = 'index-tests';
    Storage = new ElectronStorage(dbAppname, dbName);
    DB = new Datastore({storage: Storage});
});

afterAll(() => {
    const toDelete = new AppDirectory(dbAppname);
    ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted index-tests');
        })
        .catch(console.log);
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000000;
describe('testing the index set and fetch', () => {
    let Bdir;
    let Eversion;
    const docs: any = [
        {
            username: 'joshua', age: 24,
            company: {
                name: 'OED',
                age: 56,
            },
            loggedIn: false,
        },
        {
            username: 'timothy', age: 32,
            company: {
                name: 'OED',
                age: 56,
            },
            loggedIn: true,
        },
        {
            username: 'sheila', age: 29,
            company: {
                name: 'Helicorp',
                age: 9,
            },
            loggedIn: false,
        },
    ];

    let companyNameObj1;
    let usernameObj2;
    let file1;
    let file2;
    let backupFile1;
    let backupFile2;

    test('ensuring unique indices', () => {
        expect.assertions(1);
        Eversion = Storage.version;
        Bdir = path.join(Storage.collectionPath, Eversion, 'states');
        return DB.ensureIndex({fieldName: 'company.name', unique: false})
            .then(() => {
                return DB.ensureIndex({fieldName: 'username', unique: true});
            })
            .then(() => Promise.all(docs.map((d) => DB.insert(d))))
            .then((objs) => {
                file1 = path.join(Storage.collectionPath, 'index_company.name.db');
                file2 = path.join(Storage.collectionPath, 'index_username.db');
                backupFile1 = path.join(Storage.collectionPath, Storage.version, 'states', 'index_company.name', 'past');
                backupFile2 = path.join(Storage.collectionPath, Storage.version, 'states', 'index_username', 'past');
                expect(objs.length).toEqual(3);
            });
    });

    test('saving index and fetch index', () => {
        expect.assertions(12);
        let companyName;
        return DB.saveIndex('company.name')
            .then(() => DB.saveIndex('username'))
            .then(() => Storage.fetchIndex('company.name'))
            .then((indexArray) => {
                companyName = indexArray;
                return Storage.fetchIndex('username');
            })
            .then((indexArray) => {
                companyNameObj1 = companyName;
                usernameObj2 = indexArray;
                expect(companyName).toBeInstanceOf(Object);
                expect(indexArray).toBeInstanceOf(Object);
                expect(companyName[0].key).toEqual('OED');
                expect(companyName[1].key).toEqual('Helicorp');
                expect(companyName[0].value.length).toEqual(2);
                expect(companyName[1].value.length).toEqual(1);
                expect(indexArray[0].key).toEqual('sheila');
                expect(indexArray[1].key).toEqual('joshua');
                expect(indexArray[2].key).toEqual('timothy');
                expect(indexArray[0].value.length).toEqual(1);
                expect(indexArray[1].value.length).toEqual(1);
                expect(indexArray[2].value.length).toEqual(1);
            });
    });

    test('removing all items', () => {
        expect.assertions(1);
        return DB.remove({})
            .then((num) => {
                expect(num).toEqual(3);
            });
    });

    test('fetchign index after removal', () => {
        expect.assertions(1);
        return Storage.fetchIndex('company.name')
            .then((index) => {
                expect(index[0].key).toEqual(companyNameObj1[0].key);
            });
    });

    test('saving all removed files index', () => {
        expect.assertions(4);
        return DB.saveIndex('company.name')
            .then(() => DB.saveIndex('username'))
            .then(() => {
                expect(existsSync(file1)).toBeFalsy();
                expect(readFileSync(backupFile1).toString()).toEqual('[{"key":null,"value":[]}]');
                expect(existsSync(file2)).toBeFalsy();
                expect(readFileSync(backupFile2).toString()).toEqual('[{"key":null,"value":[]}]');
            });
    });

    test('loading saved null index and insert', () => {
        expect.assertions(2);
        return Storage.fetchIndex('company.name')
            .then((index) =>  {
                if (index === undefined) {
                    return new Promise((res) => res());
                } else {
                    return DB.insertIndex('company.name', index);
                }
            })
            .then(() => {
                return DB.update({
                        username: 'karma', age: 23,
                            company: {
                            name: 'OED',
                                age: 9,
                        },
                        loggedIn: false,
                    }, {$set: {loggedIn: true}}, {
                        upsert: true,
                        exactObjectFind: true,
                    });
            })
            .then(() => DB.remove({loggedIn: false}))
            .then(() => DB.saveIndex('company.name'))
            .then(() => {
                expect(existsSync(path.join(Storage.collectionPath, `index_company.name.db`))).toBeTruthy();
                expect(existsSync(path.join(Storage.collectionPath, Storage.version, 'states', 'index_company.name', 'past'))).toBeTruthy();
            });
    });
});
