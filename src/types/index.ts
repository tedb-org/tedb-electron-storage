import {IStorageDriver} from './StorageDriver_BaseInterface';

export type TiteratorCB = (key: string, value: any, iteratorNumber?: number) => any;

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
    iterate(iteratorCallback: TiteratorCB): Promise<any>;
    exists(key: string, index: any, fieldName: string): Promise<any>;
    collectionSanitize(keys: string[]): Promise<null>;
    keys(): Promise<string[]>;
    clear(): Promise<null>;
}
