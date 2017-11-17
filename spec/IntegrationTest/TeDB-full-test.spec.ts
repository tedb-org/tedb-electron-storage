import {Datastore, IDatastore, Index} from 'tedb';
import {ElectronStorage} from '../../src/StorageDriver';
import {AppDirectory} from '../../src/AppDirectory';
import {IStorageDriverExtended} from '../../src/types';
import {ClearDirectory, UnlinkFile, RmDir, AppendFile} from '../../src/utils';
import {existsSync} from 'fs';
const path = require('path');

let Storage: IStorageDriverExtended;
let TestDB: IDatastore;
let dbAppName: string;
let dbName: string;
beforeAll(() => {
    dbAppName = 'tedb-integration-storage-full-test';
    dbName = 'tedb';
    Storage = new ElectronStorage(dbAppName, dbName);
    TestDB = new Datastore({storage: Storage});
});

afterAll(() => {
    const toDelete = new AppDirectory(dbAppName);
    ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted full tedb tests');
        })
        .catch(console.log);
});

describe('testing tedb integration', () => {
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

    let obj1;
    let obj2;
    let obj3;
    let file1;
    let file2;
    let file3;
    let backupFile1;
    let backupFile2;
    let backupFile3;

    test('ensuring unique indices', () => {
        expect.assertions(1);
        Eversion = Storage.version;
        Bdir = path.join(Storage.collectionPath, Eversion, 'states');
        return TestDB.ensureIndex({fieldName: 'company.name', unique: false})
            .then(() => {
                return TestDB.ensureIndex({fieldName: 'username', unique: true});
            })
            .then(() => Promise.all(docs.map((d) => TestDB.insert(d))))
            .then((objs) => {
                expect(objs.length).toEqual(3);
                obj1 = objs[0];
                obj2 = objs[1];
                obj3 = objs[2];
                file1 = path.join(Storage.collectionPath, `${objs[0]._id}.db`);
                file2 = path.join(Storage.collectionPath, `${objs[1]._id}.db`);
                file3 = path.join(Storage.collectionPath, `${objs[2]._id}.db`);
                backupFile1 = path.join(Bdir, `${objs[0]._id}`);
                backupFile2 = path.join(Bdir, `${objs[1]._id}`);
                backupFile3 = path.join(Bdir, `${objs[2]._id}`);
            });
    });

    test('saving and fetch indices', () => {
        expect.assertions(2);
        let companyName;
        return TestDB.saveIndex('company.name')
            .then(() => TestDB.saveIndex('username'))
            .then(() => Storage.fetchIndex('company.name'))
            .then((indexArray) => {
                companyName = indexArray;
                return Storage.fetchIndex('username');
            })
            .then((indexArray) => {
                expect(indexArray.length).toEqual(3);
                expect(companyName.length).toEqual(2);
            });
    });

    test('finding all items', () => {
        expect.assertions(1);
        return TestDB.find({}).exec()
            .then((items) => {
                items = items as any[];
                expect(items.length).toEqual(3);
            });
    });

    test('removing an item', () => {
        expect.assertions(2);
        return TestDB.remove({_id: obj1._id})
            .then(() => {
                expect(existsSync(file1)).toBeFalsy();
                expect(existsSync(backupFile1)).toBeFalsy();
                return TestDB.insert(obj1);
            });
    });

    test('finding all when current file of one is missing', () => {
        expect.assertions(2);
        return UnlinkFile(file1)
            .then(() => TestDB.find({}).exec())
            .then((d) => {
                d = d as any[];
                expect(d.length).toEqual(3);
                expect(existsSync(file1)).toBeTruthy();
            });
    });

    test('make a document unparsable', () => {
        expect.assertions(2);
        return AppendFile(file2, '&')
            .then(() => TestDB.find({}).exec())
            .then((items) => {
                items = items as any[];
                expect(items.length).toEqual(3);
                expect(existsSync(file2)).toBeTruthy();
            });
    });

    test('making both current and backup unparsable', () => {
        expect.assertions(5);
        let response;
        return AppendFile(file3, '&')
            .then(() => AppendFile(path.join(backupFile3, 'past'), '&'))
            .then(() => TestDB.find({}).exec())
            .then((res) => {
                res = res as any[];
                response = res;
                return TestDB.remove({_id: obj3._id})
                    .then(() => TestDB.sanitize())
                    .then(() => {
                        return TestDB.getIndices();
                    })
                    .then((indices) => {
                        const ind: Index = indices.get('username');
                        if (ind) {
                            return ind.search(obj3._id);
                        }
                    })
                    .then((ind) => {
                        expect(response.length).toEqual(2);
                        expect(existsSync(file3)).toBeFalsy();
                        expect(existsSync(path.join(backupFile3, 'past'))).toBeFalsy();
                        expect(existsSync(file3)).toBeFalsy();
                        expect(ind.length).toEqual(0);
                    });
            });
    });

    test('removing index', () => {
        expect.assertions(3);
        return Storage.removeIndex('username')
            .then(() => {
                expect(path.join(Storage.collectionPath, 'index_username.db')).toBeFalsy();
                expect(existsSync(path.join(Bdir, 'index_username'))).toBeFalsy();
                expect(existsSync(path.join(Bdir, 'index_username', 'past'))).toBeFalsy();
            });
    });

    test('clearing collection', () => {
        expect.assertions(1);
        return Storage.clear()
            .then(() => {
                expect(existsSync(Storage.collectionPath)).toBeFalsy();
            });
    });
});
