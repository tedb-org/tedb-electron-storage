/*
import {Datastore, IDatastore, Index} from 'tedb';
import {ElectronStorage} from '../../src/StorageDriver';
import {AppDirectory} from '../../src/AppDirectory';
import {IStorageDriverExtended} from '../../src/types';
import {ClearDirectory, UnlinkFile, RmDir, AppendFile, safeReadFile} from '../../src/utils';
import {existsSync} from 'graceful-fs';
const path = require('path');

const shuffleNumbersArray = ( nums: number[]): number[] => {
    let tmp: number;
    let current: number;
    let top: number = nums.length;
    if (top) {
        while (--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = nums[current];
            nums[current] = nums[top];
            nums[top] = tmp;
        }
    }
    return nums;
};

const getRandomArray = ( n: number): number[] => {
    const b: number[] = [];
    for (let i = 0; i < n ; ++i) {
        b.push(i);
    }
    return shuffleNumbersArray(b);
};

let Storage: IStorageDriverExtended;
let TestDB: IDatastore;
let dbAppName: string;
let dbName: string;
beforeAll(() => {
    dbAppName = 'tedb-integration-storage-large-test';
    dbName = 'tedb';
    Storage = new ElectronStorage(dbAppName, dbName);
    TestDB = new Datastore({storage: Storage});
});

afterAll(() => {
    const toDelete = new AppDirectory(dbAppName);
    /!*ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted large tedb tests');
        })
        .catch(console.log);*!/
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000000;
describe('testing large scale', () => {
    //                          100,000
    const nums = getRandomArray(100000);
    const strs = nums.map((n) => n.toString());
    const docs = [];
    nums.forEach((n, i) => {
        docs.push({nums: n, Us: strs[i], Ns: strs[i], u: 1});
    });
    const docs1 = docs.splice(0, 10000);
    const docs2 = docs.splice(0, 10000);
    const docs3 = docs.splice(0, 10000);
    const docs4 = docs.splice(0, 10000);
    const docs5 = docs.splice(0, 10000);
    const docs6 = docs.splice(0, 10000);
    const docs7 = docs.splice(0, 10000);
    const docs8 = docs.splice(0, 10000);
    const docs9 = docs.splice(0, 10000);
    const docs10 = docs.splice(0, 10000);

    // To test non indexed speeds comment out this describe
    describe('testing uniq and regular index DB', () => {
        test('ensuring index', () => {
            expect.assertions(2);
            return TestDB.ensureIndex({fieldName: 'Us', unique: true})
                .then(() => {
                    return TestDB.ensureIndex({fieldName: 'Ns'});
                })
                .then(() => {
                    return TestDB.getIndices();
                })
                .then((res) => {
                    res.forEach((v: Index, k: string) => {
                        expect(v).toBeInstanceOf(Index);
                    });
                });
        });

    });

    describe('inserting', () => {
        const s1 = new Date().getTime();
        test('1', () => {
            expect.assertions(1);
            return Promise.all(docs1.map((d) => TestDB.insert(d)))
                .then((items) => {
                    const e1 = new Date().getTime();
                    const t1 = e1 - s1;
                    console.log(t1);
                    items = items as any[];
                    expect(items.length).toEqual(10000);
                });
        });

        test('2', () => {
            expect.assertions(1);
            return Promise.all(docs2.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });

        test('3', () => {
            expect.assertions(1);
            return Promise.all(docs3.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });

        test('4', () => {
            expect.assertions(1);
            return Promise.all(docs4.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });

        test('5', () => {
            expect.assertions(1);
            return Promise.all(docs5.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });

        test('6', () => {
            expect.assertions(1);
            return Promise.all(docs6.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });

        test('7', () => {
            expect.assertions(1);
            return Promise.all(docs7.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });

        test('8', () => {
            expect.assertions(1);
            return Promise.all(docs8.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });

        test('9', () => {
            expect.assertions(1);
            return Promise.all(docs9.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });

        test('10', () => {
            expect.assertions(1);
            return Promise.all(docs10.map((doc) => TestDB.insert(doc)))
                .then((res) => {
                    const e2 = new Date().getTime();
                    const total = e2 - s1;
                    console.log(total);
                    res = res as any[];
                    expect(res.length).toEqual(10000);
                });
        });
    });

    describe('finding', () => {
        let allFiles;

        test('finding all files', () => {
            const s = new Date().getTime();
            expect.assertions(1);
            return TestDB.find({}).exec()
                .then((items) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    items = items as any[];
                    allFiles = items;
                    expect(items.length).toEqual(100000);
                });
        });

        test('finding worst case uniq, 1', () => {
            expect.assertions(1);
            const s = new Date().getTime();
            return TestDB.find({Us: '1'}).exec()
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    res = res as any[];
                    expect(res.length).toEqual(1);
                });
        });

        test('finding best case uniq, 50,000', () => {
            expect.assertions(1);
            const s = new Date().getTime();
            return TestDB.find({Us: '50000'}).exec()
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    res = res as any[];
                    expect(res.length).toEqual(1);
                });
        });

        test('finding worst case non uniq, 1', () => {
            expect.assertions(1);
            const s = new Date().getTime();
            return TestDB.find({Ns: '2'})
                .exec()
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    res = res as any[];
                    expect(res.length).toEqual(1);
                });
        });

        test('finding best case non uniq, 50,000', () => {
            expect.assertions(1);
            const s = new Date().getTime();
            return TestDB.find({Ns: '50001'})
                .exec()
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    res = res as any[];
                    expect(res.length).toEqual(1);
                });
        });

        test('all base files exist', () => {
            expect.assertions(2);
            expect(allFiles.length).toEqual(100000);
            let allexist = true;
            allFiles.forEach((f) => {
                if (!existsSync(path.join(Storage.collectionPath, `${f._id}.db`))) {
                    allexist = false;
                }
            });
            expect(allexist).toEqual(true);
        });

        test('all backup files exist', () => {
            expect.assertions(2);
            expect(allFiles.length).toEqual(100000);
            let allexist = true;
            allFiles.forEach((f) => {
                if (!existsSync(path.join(Storage.collectionPath, Storage.version, 'states', f._id, 'past'))) {
                    allexist = false;
                }
            });
            expect(allexist).toEqual(true);
        });

        test('storing index', () => {
            expect.assertions(2);
            return TestDB.saveIndex('Us')
                .then(() => {
                    expect(path.join(Storage.collectionPath, `index_Us.db`)).toBeTruthy();
                    expect(path.join(Storage.collectionPath, Storage.version, 'states', `index_Us.db`)).toBeTruthy();
                });
        });

        test('storing index', () => {
            expect.assertions(2);
            return TestDB.saveIndex('Ns')
                .then(() => {
                    expect(path.join(Storage.collectionPath, `index_Ns.db`)).toBeTruthy();
                    expect(path.join(Storage.collectionPath, Storage.version, 'states', `index_Ns.db`)).toBeTruthy();
                });
        });
    });

    describe('updating', () => {
        test('updating worst case uniq, 1', () => {
            expect.assertions(2);
            const s = new Date().getTime();
            return TestDB.update({Us: '1'}, {
                $set: {u: 3},
                $inc: {u: 1},
                $mul: {u: 2},
            }, {
                multi: false,
                returnUpdatedDocs: true,
            })
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    res = res as any[];
                    expect(res.length).toEqual(1);
                    expect(res[0].u).toEqual(8);
                });
        });

        test('updating best case uniq, 50,000', () => {
            expect.assertions(2);
            const s = new Date().getTime();
            return TestDB.update({Us: '50000'}, {
                $set: {u: 3},
                $inc: {u: 1},
                $mul: {u: 2},
            }, {
                multi: false,
                returnUpdatedDocs: true,
            })
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    res = res as any[];
                    expect(res.length).toEqual(1);
                    expect(res[0].u).toEqual(8);
                });
        });

        test('updating worst case non uniq, 1', () => {
            expect.assertions(2);
            const s = new Date().getTime();
            return TestDB.update({Ns: '2'}, {
                $set: {u: 3},
                $inc: {u: 1},
                $mul: {u: 2},
            }, {
                multi: false,
                returnUpdatedDocs: true,
            })
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    res = res as any[];
                    expect(res.length).toEqual(1);
                    expect(res[0].u).toEqual(8);
                });
        });

        test('updating best case non uniq, 50,000', () => {
            expect.assertions(2);
            const s = new Date().getTime();
            return TestDB.update({Ns: '50001'}, {
                $set: {u: 3},
                $inc: {u: 1},
                $mul: {u: 2},
            }, {
                multi: false,
                returnUpdatedDocs: true,
            })
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    res = res as any[];
                    expect(res.length).toEqual(1);
                    expect(res[0].u).toEqual(8);
                });
        });
    });

    describe('removing', () => {
        test('removing worst case uniq, 1', () => {
            expect.assertions(1);
            const s = new Date().getTime();
            return TestDB.remove({Us: '3'})
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    expect(res).toEqual(1);
                });
        });

        test('removing best case uniq, 50,000', () => {
            expect.assertions(1);
            const s = new Date().getTime();
            return TestDB.remove({Us: '50003'})
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    expect(res).toEqual(1);
                });
        });

        test('removing worst case non uniq, 2', () => {
            expect.assertions(1);
            const s = new Date().getTime();
            return TestDB.remove({Ns: '1'})
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    expect(res).toEqual(1);
                });
        });

        test('removing best case non uniq, 50,001', () => {
            expect.assertions(1);
            const s = new Date().getTime();
            return TestDB.remove({Ns: '50000'})
                .then((res) => {
                    const e = new Date().getTime();
                    console.log(e - s);
                    expect(res).toEqual(1);
                });
        });

        test('removing all and sanatize', () => {
            expect.assertions(3);
            let numb: number;
            let Ns: any;
            let Us: any;
            return TestDB.remove({})
                .then((num) => {
                    numb = num;
                    console.log('sanitize')
                    return TestDB.sanitize();
                })
                .then(() => TestDB.saveIndex('Ns'))
                .then(() => TestDB.saveIndex('Us'))
                .then(() => safeReadFile(path.join(Storage.collectionPath, Storage.version, 'states', 'index_Ns', 'past')))
                .then((index) => {
                    Ns = index;
                    return safeReadFile(path.join(Storage.collectionPath, 'index_Us'));
                })
                .then((index) => {
                    Us = index;
                    expect(numb).toEqual(99996);
                    expect(Us).toEqual(false);
                    expect(Ns).toEqual('[{"key":null,"value":[]}]');
                });
        });
    });
});
*/
