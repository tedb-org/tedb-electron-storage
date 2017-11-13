import {IStorageDriver} from './StorageDriver_BaseInterface';

export interface IStorageDriverExtended extends IStorageDriver {
    collectionPath: string;
    allKeys: string[];
    version: string;

    getItem(key: string): Promise<any>;
    setItem(key: string, value: any): Promise<any>;
    removeItem(key: string): Promise<null>;
    storeIndex(key: string, index: string): Promise<any>;
    fetchIndex(key: string): Promise<any[]>;
    removeIndex(key: string): Promise<null>;
    iterate(iteratorCallback: (key: string, value: any, iteratorNumber?: number) => any): Promise<any>;
    keys(): Promise<string[]>;
    clear(): Promise<null>;
}
