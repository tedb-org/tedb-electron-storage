import {ElectronStorage} from '../../src/StorageDriver';
import {Datastore, IDatastore} from 'tedb';
import {IStorageDriverExtended} from '../../src/types';
import {AppDirectory} from '../../src/AppDirectory';
import {ClearDirectory, UnlinkFile, AppendFile} from '../../src/utils';
import {existsSync} from 'fs';
const path = require('path');

let Storage: IStorageDriverExtended;
let TestDB: IDatastore;
let dbAppName: string;
let dbName: string;
beforeAll(() => {
    dbAppName = 'tedb-electron-storage-keys-tests';
    dbName = 'keys-tests';
    Storage = new ElectronStorage(dbAppName, dbName);
    TestDB = new Datastore({storage: Storage});
});

afterAll(() => {
    const toDelete = new AppDirectory(dbAppName);
    ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted keys-tests');
        })
        .catch(console.log);
});

describe('testing keys', () => {
    let Eversion;
    let Bdir;
    const docs: any = [
        {a: 0},
        {a: 1},
        {a: 2},
    ];
    let file1;
    let file2;
    let file3;
    let backupFile1;
    let backupFile2;
    let backupFile3;
    let obj1;
    let obj2;
    let obj3;

    test('inserting objects', () => {
        expect.assertions(1);
        return Promise.all(docs.map((doc) => {
                return TestDB.insert(doc);
            }))
            .then((items) => {
                Eversion = Storage.version;
                Bdir = path.join(Storage.collectionPath, Eversion, 'states');
                expect(items.length).toEqual(3);
                file1 = path.join(Storage.collectionPath, `${items[0]._id}.db`);
                file2 = path.join(Storage.collectionPath, `${items[1]._id}.db`);
                file3 = path.join(Storage.collectionPath, `${items[2]._id}.db`);
                backupFile1 = path.join(Bdir, `${items[0]._id}`);
                backupFile2 = path.join(Bdir, `${items[1]._id}`);
                backupFile3 = path.join(Bdir, `${items[2]._id}`);
                obj1 = items[0];
                obj2 = items[1];
                obj3 = items[2];
            });
    });

    test('finding all objects with empty search', () => {
        // this will use keys because the search is empty
        expect.assertions(1);
        return TestDB.find({}).exec()
            .then((objs) => {
                objs = objs as any[];
                expect(objs.length).toEqual(3);
            });
    });

    test('removing a key from base location', () => {
        expect.assertions(2);
        return UnlinkFile(file1)
            .then(() => TestDB.find({}).exec())
            .then((objs) => {
                objs = objs as any[];
                expect(existsSync(file1)).toBeTruthy();
                expect(objs.length).toEqual(3);
            });
    });

    test('removing a key and making one unparcable', () => {
        expect.assertions(2);
        return UnlinkFile(file1)
            .then(() => AppendFile(file2, '&'))
            .then(() => TestDB.find({}).exec())
            .then((objs) => {
                objs = objs as any[];
                expect(existsSync(file1)).toBeTruthy();
                expect(objs.length).toEqual(3);
            });
    });

    test('removing a key and making an items current and backup unparsable', () => {
        expect.assertions(3);
        return UnlinkFile(file1)
            .then(() => AppendFile(file2, '&'))
            .then(() => AppendFile(path.join(backupFile2, 'past'), '&'))
            .then(() => TestDB.find({}).exec())
            .then((objs) => {
                objs = objs as any[];
                expect(objs.length).toEqual(2);
                expect(existsSync(file1)).toBeTruthy();
                expect(existsSync(file2)).toBeFalsy();
                return TestDB.insert(obj2);
            });
    });

    test('not having any keys', () => {
        expect.assertions(1);
        Storage.allKeys = [];
        return TestDB.find({}).exec()
            .then((objs) => {
                objs = objs as any[];
                expect(objs.length).toEqual(3);
            });
    });
});
