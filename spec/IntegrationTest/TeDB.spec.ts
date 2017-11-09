import {Index, Datastore} from 'tedb';
import {ElectronStorage} from '../../src/StorageDriver';

let Storage;
beforeAll(() => {
    Storage = new ElectronStorage('tedb-integration-storage-tests', 'tedb');
});

describe('tedb integration tests', () => {

});
