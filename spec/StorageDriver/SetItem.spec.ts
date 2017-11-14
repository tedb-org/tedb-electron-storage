import {ElectronStorage} from '../../src/StorageDriver';
import {IStorageDriverExtended} from '../../src/types';
import {AppDirectory} from '../../src/AppDirectory';
import {ClearDirectory} from '../../src/utils';
import {existsSync, readFileSync} from 'fs';
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

describe('testing setItem', () => {
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
        expect.assertions(4);
        if (existsSync(path.join(Storage.collectionPath, Eversion, 'states', '1234', 'past'))) {
            const file = readFileSync(path.join(Storage.collectionPath, Eversion, 'states', '1234', 'past'), {encoding: 'utf8'});
            const obj = JSON.parse(file);
            expect(obj.object.item).toEqual(1);
            expect(obj.object.item2).toEqual('string');
            expect(obj.object.item4).toEqual(false);
            expect(obj.array).toEqual(expect.arrayContaining([1, 2, 3, 4]));
        }
    });
});
