import {ElectronStorage} from '../../src/StorageDriver';
import {IStorageDriverExtended} from '../../src/types';
import {AppDirectory} from '../../src/AppDirectory';
import {ClearDirectory, safeParse} from '../../src/utils';
import {existsSync, readFileSync} from 'graceful-fs';
import {isEmpty} from 'tedb';
const path = require('path');

let Storage: IStorageDriverExtended;
let dbAppname: string;
let dbName: string;
beforeAll(() => {
    dbAppname = 'tedb-electron-storage-tests';
    dbName = 'setItem-tests';
    Storage = new ElectronStorage(dbAppname, dbName);
});

afterAll(() => {
    const toDelete = new AppDirectory(dbAppname);
    ClearDirectory(toDelete.userData())
        .then(() => {
            console.log('deleted setItem-tests');
        })
        .catch(console.log);
});

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000000;
describe('testing setItem', () => {
    const a = new Buffer(3);
    let Eversion;
    const firstItem: any = {
        object: {
            item: 1, item2: 'string', item3: null, item4: false,
        },
        array: [1, 2, 3, 4], nulled: null,
    };
    const secondItem: any = {
        object: {
            item: 2, item2: 'notAstring', item3: null, item4: true,
        },
        array: [4, 3, 2, 1],
    };
    test('setting a new object', () => {
        expect.assertions(4);
        Eversion = Storage.version;
        return Storage.setItem('1234', firstItem)
            .then((obj) => {
                expect(obj.object.item).toEqual(1);
                expect(obj.object.item2).toEqual('string');
                expect(obj.object.item4).toEqual(false);
                expect(obj.array).toEqual(expect.arrayContaining([1, 2, 3, 4]));
            });
    });

    test('Set new Item in same spot', () => {
        expect.assertions(4);
        return Storage.setItem('1234', secondItem)
            .then((obj) => {
                expect(obj.object.item).toEqual(2);
                expect(obj.object.item2).toEqual('notAstring');
                expect(obj.object.item4).toEqual(true);
                expect(obj.array).toEqual(expect.arrayContaining([4, 3, 2, 1]));
            });
    });

    test('that past item is the firstItem not the secondItem', () => {
        expect.assertions(8);
        if (existsSync(path.join(Storage.collectionPath, Eversion, 'states', '1234', 'past'))) {
            const file = readFileSync(path.join(Storage.collectionPath, Eversion, 'states', '1234', 'past'), {encoding: 'utf8'});
            const file2 = readFileSync(path.join(Storage.collectionPath, '1234.db'), {encoding: 'utf8'});
            const obj2 = JSON.parse(file2);
            return safeParse(file)
                .then((d) => {
                    const obj = d;

                    expect(obj.object.item).toEqual(firstItem.object.item);
                    expect(obj.object.item2).toEqual(firstItem.object.item2);
                    expect(obj.object.item4).toEqual(firstItem.object.item4);
                    expect(obj.array).toEqual(expect.arrayContaining(firstItem.array));

                    expect(obj2.object.item).toEqual(secondItem.object.item);
                    expect(obj2.object.item2).toEqual(secondItem.object.item2);
                    expect(obj2.object.item4).toEqual(secondItem.object.item4);
                    expect(obj2.array).toEqual(expect.arrayContaining(secondItem.array));
                });
        }
    });
});
