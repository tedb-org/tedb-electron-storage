import {Index, Datastore, IDatastore} from 'tedb';
import {ElectronStorage} from '../../src/StorageDriver';
import {AppDirectory} from '../../src/AppDirectory';
import {IStorageDriverExtended} from '../../src/types';
import {existsSync} from 'graceful-fs';
import {ClearDirectory, safeReadFile, parseJSON, safeParse, UnlinkFile, RmDir, AppendFile, SafeWrite} from '../../src/utils';
const path = require('path');

let Storage: IStorageDriverExtended;
let TestDB: IDatastore;
let dbAppname: string;
let dbName: string;

beforeAll(() => {
    dbAppname = 'tedb-integration-storage-non-unique-index-tests';
    dbName = 'tedb-nu';
    Storage = new ElectronStorage(dbAppname, dbName);
    TestDB = new Datastore({storage: Storage});
});

afterAll(() => {
    const toDelete = new AppDirectory(dbAppname);
    ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted non-unique tedb indices');
        })
        .catch(console.log);
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000000;
describe('tedb integration tests non-unique index', () => {
    let Eversion;
    let toFind: AppDirectory;
    const docs: any = [
        {isSynced: false, num: 0, time: null, odd: ''},
        {isSynced: false, num: -1, time: new Date(), odd: ''},
        {isSynced: true, num: 1, time: null, odd: 'string'},
    ];
    let BDir;
    let indexReset;

    test('ensure index + insert', () => {
        Eversion = Storage.version;
        expect.assertions(1);
        return TestDB.ensureIndex({fieldName: 'isSynced', unique: false})
            .then(() => {
                toFind = new AppDirectory(dbAppname);
                BDir = path.join(Storage.collectionPath, Storage.version, 'states', 'index_isSynced');
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
        return TestDB.saveIndex('isSynced')
            .then(() => {
                file1 = path.join(Storage.collectionPath, 'index_isSynced.db');
                file2 = path.join(Storage.collectionPath, Eversion, 'states', 'index_isSynced', 'past');
                return safeReadFile(file1);
            })
            .then((data) => {
                return safeParse(data as string);
            })
            .then((data) => {
                data1 = data;
                return safeReadFile(file2);
            })
            .then((data) => {
                return safeParse(data as string);
            })
            .then((data) => {
                data2 = data;
                expect(existsSync(file1)).toBeTruthy();
                expect(existsSync(file2)).toBeTruthy();
                expect(data1.length).toEqual(2);
                expect(data2.length).toEqual(2);
            });
    });

    test('fetching the index', () => {
        expect.assertions(1);
        return Storage.fetchIndex('isSynced')
            .then((indexArray) => {
                indexReset = indexArray;
                expect(indexArray.length).toEqual(2);
            });
    });

    test('removing base index and fetch', () => {
        expect.assertions(1);
        return UnlinkFile(path.join(Storage.collectionPath, 'index_isSynced.db'))
            .then(() => Storage.fetchIndex('isSynced'))
            .then((indexArray) => {
                expect(indexArray.length).toEqual(2);
            });
    });

    test('removing base and past file', () => {
        expect.assertions(4);
        return UnlinkFile(path.join(Storage.collectionPath, 'index_isSynced.db'))
            .then(() => UnlinkFile(path.join(BDir, 'past')))
            .then(() => Storage.fetchIndex('isSynced'))
            .then((item) => {
                expect(item).toEqual(undefined);
                expect(existsSync(BDir)).toEqual(false);
                expect(existsSync(path.join(BDir, 'past'))).toEqual(false);
                expect(existsSync(path.join(Storage.collectionPath, 'index_isSynced.db'))).toEqual(false);
                return Storage.storeIndex('isSynced', JSON.stringify(indexReset));
            });
    });

    test('removing all', () => {
        expect.assertions(4);
        return UnlinkFile(path.join(Storage.collectionPath, 'index_isSynced.db'))
            .then(() => UnlinkFile(path.join(BDir, 'past')))
            .then(() => RmDir(BDir))
            .then(() => Storage.fetchIndex('isSynced'))
            .then((item) => {
                expect(item).toEqual(undefined);
                expect(existsSync(BDir)).toEqual(false);
                expect(existsSync(path.join(BDir, 'past'))).toEqual(false);
                expect(existsSync(path.join(Storage.collectionPath, 'index_isSynced.db'))).toEqual(false);
                return Storage.storeIndex('isSynced', JSON.stringify(indexReset));
            });
    });

    test('making base file not json', () => {
        expect.assertions(1);
        return AppendFile(path.join(Storage.collectionPath, 'index_isSynced.db'),  '^')
            .then(() => Storage.fetchIndex('isSynced'))
            .then((item) => {
                expect(item.length).toEqual(2);
            });
    });

    test('making both files not json', () => {
        expect.assertions(4);
        return AppendFile(path.join(Storage.collectionPath, 'index_isSynced.db'), '^')
            .then(() => AppendFile(path.join(BDir, 'past'), '^'))
            .then(() => Storage.fetchIndex('isSynced'))
            .then((item) => {
                expect(item).toEqual(undefined);
                expect(existsSync(BDir)).toEqual(false);
                expect(existsSync(path.join(BDir, 'past'))).toEqual(false);
                expect(existsSync(path.join(Storage.collectionPath, 'index_isSynced.db'))).toEqual(false);
                return Storage.storeIndex('isSynced', JSON.stringify(indexReset));
            });
    });

    test('making base not json and removing past file', () => {
        expect.assertions(4);
        return AppendFile(path.join(Storage.collectionPath, 'index_isSynced.db'), '^')
            .then(() => UnlinkFile(path.join(BDir, 'past')))
            .then(() => Storage.fetchIndex('isSynced'))
            .then((item) => {
                expect(item).toEqual(undefined);
                expect(existsSync(BDir)).toEqual(false);
                expect(existsSync(path.join(BDir, 'past'))).toEqual(false);
                expect(existsSync(path.join(Storage.collectionPath, 'index_isSynced.db'))).toEqual(false);
                return Storage.storeIndex('isSynced', JSON.stringify(indexReset));
            });
    });

    test('making base not json and removing backup directory', () => {
        expect.assertions(4);
        return AppendFile(path.join(Storage.collectionPath, 'index_isSynced.db'), '^')
            .then(() => UnlinkFile(path.join(BDir, 'past')))
            .then(() => RmDir(BDir))
            .then(() => Storage.fetchIndex('isSynced'))
            .then((item) => {
                expect(item).toEqual(undefined);
                expect(existsSync(BDir)).toEqual(false);
                expect(existsSync(path.join(BDir, 'past'))).toEqual(false);
                expect(existsSync(path.join(Storage.collectionPath, 'index_isSynced.db'))).toEqual(false);
                return Storage.storeIndex('isSynced', JSON.stringify(indexReset));
            });
    });

    test('no base, backup dir exists, but backup file is not json', () => {
        expect.assertions(4);
        return UnlinkFile(path.join(Storage.collectionPath, 'index_isSynced.db'))
            .then(() => AppendFile(path.join(BDir, 'past'), '^'))
            .then(() => Storage.fetchIndex('isSynced'))
            .then((item) => {
                expect(item).toEqual(undefined);
                expect(existsSync(BDir)).toEqual(false);
                expect(existsSync(path.join(BDir, 'past'))).toEqual(false);
                expect(existsSync(path.join(Storage.collectionPath, 'index_isSynced.db'))).toEqual(false);
                return Storage.storeIndex('isSynced', JSON.stringify(indexReset));
            });
    });

    test('no base, backup dir exists, but backup is nulled', () => {
        expect.assertions(4);
        return UnlinkFile(path.join(Storage.collectionPath, 'index_isSynced.db'))
            .then(() => SafeWrite(path.join(BDir, 'past'), '[{"key":null,"value":[]}]'))
            .then(() => Storage.fetchIndex('isSynced'))
            .then((item) => {
                expect(item).toEqual(undefined);
                expect(existsSync(BDir)).toEqual(false);
                expect(existsSync(path.join(BDir, 'past'))).toEqual(false);
                expect(existsSync(path.join(Storage.collectionPath, 'index_isSynced.db'))).toEqual(false);
                return Storage.storeIndex('isSynced', JSON.stringify(indexReset));
            });
    });

    test('clearing indexed items', () => {
        expect.assertions(2);
        let file1;
        let file2;
        let data2;
        return TestDB.remove({})
            .then(() => {
                return TestDB.getIndices();
            })
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
                    return TestDB.saveIndex('isSynced');
                }
            })
            .then(() => {
                file1 = path.join(toFind.userData(), 'db', dbName, 'index_isSynced.db');
                file2 = path.join(toFind.userData(), 'db', dbName, Eversion, 'states', 'index_isSynced', 'past');
                return safeReadFile(file2);
            })
            .then((data) => {
                return safeParse(data as string);
            })
            .then((data) => {
                data2 = data;
                expect(data2).toBeTruthy();
                expect(data2).toEqual(expect.arrayContaining([{key: null, value: []}]));
            });
    });
});
