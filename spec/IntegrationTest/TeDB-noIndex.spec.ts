import {Datastore, IDatastore} from 'tedb';
import {ElectronStorage} from '../../src/StorageDriver';
import {AppDirectory} from '../../src/AppDirectory';
import {IStorageDriverExtended} from '../../src/types';
import {existsSync} from 'fs';
import {ClearDirectory, ReadFile, parseJSON, UnlinkFile, RmDir, AppendFile, SafeWrite} from '../../src/utils';
const path = require('path');

let Storage: IStorageDriverExtended;
let TestDB: IDatastore;
let dbAppname: string;
let dbName: string;

beforeAll(() => {
    dbAppname = 'tedb-integration-storage-noIndex-test';
    dbName = 'tedb';
    Storage = new ElectronStorage(dbAppname, dbName);
    TestDB = new Datastore({storage: Storage});
});

afterAll(() => {
    const toDelete = new AppDirectory(dbAppname);
    ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted no index tedb');
        })
        .catch(console.log);
});

describe('tedb integration tests no index', () => {
    let Eversion: string;
    const docs: any = [
        {username: 'nick', lastname: 'paul'},
        {username: 'chris', lastname: 'everest'},
        {username: 'mike', lastname: 'jackson'},
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
    let Bdir;

    test('insert objects', () => {
        expect.assertions(9);
        return Promise.all(docs.map((doc) => {
                return TestDB.insert(doc);
            }))
            .then((items) => {
                Eversion = Storage.version;
                Bdir = path.join(Storage.collectionPath, Eversion, 'states');
                expect(items.length).toEqual(3);
                expect(items[0].hasOwnProperty('username')).toBeTruthy();
                expect(items[1].hasOwnProperty('_id')).toBeTruthy();
                expect(existsSync(path.join(Bdir, items[0]._id))).toBeTruthy();
                expect(existsSync(path.join(Bdir, items[1]._id))).toBeTruthy();
                expect(existsSync(path.join(Bdir, items[2]._id))).toBeTruthy();
                expect(existsSync(path.join(Bdir, items[0]._id, 'past'))).toBeTruthy();
                expect(existsSync(path.join(Bdir, items[1]._id, 'past'))).toBeTruthy();
                expect(existsSync(path.join(Bdir, items[2]._id, 'past'))).toBeTruthy();
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

    test('collection scanning for single obj', () => {
        expect.assertions(1);
        return TestDB.find({_id: obj2._id})
            .exec()
            .then((doc) => {
                doc = doc as any[];
                expect(doc.length).toEqual(1);
            });
    });

    test('collection scan - no _id', () => {
        expect.assertions(4);
        return ReadFile(file2)
            .then((rawData) => parseJSON(rawData))
            .then((obj) => {
                delete obj._id;
                return SafeWrite(file2, obj);
            })
            .then(() => TestDB.find({_id: obj2._id}).exec())
            .then((item) => {
                item = item as any[];
                expect(item.length).toEqual(1);
                const doc = item[0];
                expect(doc.hasOwnProperty('_id')).toBeTruthy();
                expect(existsSync(path.join(Bdir, doc._id, 'past'))).toBeTruthy();
                expect(existsSync(path.join(Storage.collectionPath, `${doc._id}.db`))).toBeTruthy();
            });
    });

    test('collection scan - not parsable on both current and backup', () => {
        expect.assertions(3);
        let itemCheck;
        return AppendFile(file3, '&')
            .then(() => AppendFile(path.join(backupFile3, 'past'), '&'))
            .then(() => TestDB.find({_id: obj3._id}).exec())
            .then((item) => {
                itemCheck = item as any[];
                expect(itemCheck.length).toEqual(0);
                expect(existsSync(path.join(Bdir, obj3._id, 'past'))).toBeFalsy();
                expect(existsSync(path.join(Storage.collectionPath, `${obj3._id}.db`))).toBeFalsy();
                return TestDB.insert(obj3);
            });
    });

    test('collection scan - not parsable current no backup file missing', () => {
        expect.assertions(3);
        return AppendFile(file1, '&')
            .then(() => UnlinkFile(path.join(backupFile1, 'past')))
            .then(() => TestDB.find({_id: obj1._id}).exec())
            .then((item) => {
                item = item as any[];
                expect(item.length).toEqual(0);
                expect(existsSync(path.join(Bdir, obj1._id, 'past'))).toBeFalsy();
                expect(existsSync(path.join(Storage.collectionPath, `${obj1._id}.db`))).toBeFalsy();
                return TestDB.insert(obj1);
            });
    });

    test('collection scan - not parsable and not backup directory at all', () => {
        return AppendFile(file1, '&')
            .then(() => UnlinkFile(path.join(backupFile1, 'past')))
            .then(() => RmDir(path.join(Bdir, `${obj1._id}`)))
            .then(() => TestDB.find({_id: obj1._id}).exec())
            .then((item) => {
                console.log(item);
            });
    });
});
