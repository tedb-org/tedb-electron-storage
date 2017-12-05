import {IStorageDriver, Isanitize, Iexist} from './StorageDriver_BaseInterface';

export {Isanitize, Iexist};
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
    exists(obj: Isanitize, index: any, fieldName: string): Promise<Iexist>;
    collectionSanitize(keys: string[]): Promise<null>;
    keys(): Promise<string[]>;
    clear(): Promise<null>;
}
