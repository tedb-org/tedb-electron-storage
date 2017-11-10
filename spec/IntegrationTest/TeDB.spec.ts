import {Index, Datastore, IStorageDriver, IDatastore} from 'tedb';
import {ElectronStorage} from '../../src/StorageDriver';
import {AppDirectory} from '../../src/AppDirectory';
import {existsSync} from 'fs';
import {ClearDirectory, ReadFile, parseJSON} from '../../src/utils';
const path = require('path');

let Storage: IStorageDriver;
let TestDB: IDatastore;
beforeAll(() => {
    Storage = new ElectronStorage('tedb-integration-storage-tests', 'tedb');
    TestDB = new Datastore({storage: Storage});
});

afterAll(() => {
    const toDelete = new AppDirectory('tedb-integration-storage-tests');
    /*ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted tedb');
        })
        .catch(console.log);*/
});

describe('tedb integration tests', () => {
    const toFind = new AppDirectory('tedb-integration-storage-tests');
    const docs: any = [
        {isSynced: false, num: 0, time: null, odd: ''},
        {isSynced: false, num: -1, time: new Date(), odd: ''},
        {isSynced: true, num: 1, time: null, odd: 'string'},
    ];

    test('ensure index + insert', () => {
        expect.assertions(1);
        return TestDB.ensureIndex({fieldName: 'isSynced', unique: false})
            .then(() => {
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
                const ind: Index = indices.get('isSynced');
                if (ind) {
                    return ind.toJSON();
                } else {
                    return (new Promise((res) => res(false)));
                }
            })
            .then((res) => {
                if (res === false) {
                    return new Promise((resolve) => resolve());
                } else {
                    const parsed = JSON.parse(res);
                    return Storage.storeIndex('isSynced', parsed);
                }
            })
            .then(() => {
                file1 = path.join(toFind.userData(), 'db', 'tedb', 'index_isSynced.db');
                file2 = path.join(toFind.userData(), 'db', 'tedb', 'v1', 'states', 'index_isSynced', 'past');
                return ReadFile(file1);
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
                expect(data1.length).toEqual(2);
                expect(data2.length).toEqual(2);
            });
    });

    test('clearing indexed items', () => {
        expect.assertions(1);
        let file1;
        let file2;
        let data1;
        let data2;
        return TestDB.remove({})
            .then((num) => {
                console.log(num);
                return TestDB.getIndices()
            })
            .then((indices) => {
                console.log('made it here?')
                const ind: Index = indices.get('isSynced');
                if (ind) {
                    return ind.toJSON();
                } else {
                    return (new Promise((res) => res(false)));
                }
            })
            .then((res) => {
                if (res === false) {
                    return new Promise((resolve) => resolve());
                } else {
                    const parsed = JSON.parse(res);
                    return Storage.storeIndex('isSynced', parsed);
                }
            })
            .then(() => {
                file1 = path.join(toFind.userData(), 'db', 'tedb', 'index_isSynced.db');
                file2 = path.join(toFind.userData(), 'db', 'tedb', 'v1', 'states', 'index_isSynced', 'past');
                return ReadFile(file1);
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
                expect(data2).toBeTruthy();
                console.log(data1);
                console.log(data2);
            });
    });
});
