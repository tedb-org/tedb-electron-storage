import {IStorageDriverExtended} from '../types';
import {ClearDirectory} from '../utils';

export const Clear = (Storage: IStorageDriverExtended): Promise<any> => {
    return ClearDirectory(Storage.collectionPath);
};
