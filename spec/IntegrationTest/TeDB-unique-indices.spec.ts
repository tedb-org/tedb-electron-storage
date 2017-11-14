import {Index, Datastore, IDatastore} from 'tedb';
import {ElectronStorage} from '../../src/StorageDriver';
import {AppDirectory} from '../../src/AppDirectory';
import {IStorageDriverExtended} from '../../src/types';
import {existsSync} from 'fs';
import {ClearDirectory, ReadFile, parseJSON} from '../../src/utils';
const path = require('path');

let Storage: IStorageDriverExtended;
let TestDB: IDatastore;
let dbAppName: string;
let dbName: string;

beforeAll(() => {
    dbAppName = 'tedb-integration-storage-unique-index-tests';
    dbName = 'tedb';
    Storage = new ElectronStorage(dbAppName, dbName);
    TestDB = new Datastore({storage: Storage});
});

afterAll(() => {
    const toDelete = new AppDirectory(dbAppName);
    ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted tedb unique indices');
        })
        .catch(console.log);
});

describe('tedb integration tests unique index', () => {
    let Eversion;
    const docs: any = [
        {username: 'abc', lastname: null},
        {username: '123', lastname: 'stringy'},
        {username: '*(#(@', lastname: 'hmm'},
    ];
    let Bdir;

    test('ensure index + insert', () => {
        Eversion = Storage.version;
        expect.assertions(1);
        return TestDB.ensureIndex({fieldName: 'username', unique: true})
            .then(() => {
                Bdir = path.join(Storage.collectionPath, Storage.version, 'states', 'index_username');
                return Promise.all(docs.map((doc) => {
                    return TestDB.insert(doc);
                }));
            })
            .then((res) => {
                expect(res.length).toEqual(3);
            });
    });

    test('saving index', () => {
        expect.assertions(4);
        let file1;
        let file2;
        let data1;
        let data2;
        return TestDB.getIndices()
            .then((indices) => {
                const ind: Index = indices.get('username');
                if (ind) {
                    return ind.toJSON();
                } else {
                    return new Promise((res) => res(false));
                }
            })
            .then((res) => {
                if (res === false) {
                    return new Promise((resolve) => resolve());
                } else {
                    const parsed = JSON.parse(res);
                    return Storage.storeIndex('username', parsed);
                }
            })
            .then(() => {
                file1 = path.join(Storage.collectionPath, 'index_username.db');
                file2 = path.join(Bdir, 'past');
                return ReadFile(file2);
            })
            .then((data) => {
                return parseJSON(data);
            })
            .then((data) => {
                data1 = data;
                return ReadFile(file2);
            })
            .then((data) => {
                return parseJSON(data);
            })
            .then((data) => {
                data2 = data;
                expect(existsSync(file1)).toBeTruthy();
                expect(existsSync(file2)).toBeTruthy();
                expect(data1.length).toEqual(3);
                expect(data2.length).toEqual(3);
            });
    });
});
