# [TeDB-Electron-Storage](https://github.com/tedb-org/tedb-electron-storage)
A storage driver for electron using [TeDB](https://github.com/tedb-org/teDB) as the the datastore.

## Installation

```bash
$ npm install --save tedb-electron-storage
>
$ yarn add tedb-electron-storage
```

## Usage
TeDB-Electron-Storage is a storage driver for [TeDB](https://github.com/tedb-org/teDB) that interacts with the base file system of Linux/Mac(OS)/Windows Desktop file systems to save and retrieve data. Together [TeDB](https://github.com/tedb-org/teDB) and this package make a MongoDB like database to save, retrieve, and edit data safely and quickly. This is a persist only storage driver meaning that the data does not live on in memory. It simply retrieves and returns data read from files off the files system.

This storage driver also makes a backup of every file that is created so if for instance an error occurs during a write and the data file is lost there is a backup of its previous state. Every write is "crash proof" write, and should resist this possibility. This also goes for all indices that are persisted and saved.

It is highly recommended to persist indices often. If not then a good way to remove errors of not having correct indices is to use the sanitize methods on [TeDB](https://github.com/tedb-org/teDB). These methods prevent indices to exist for files that do not exist and for files to not exist if they are not found in the indices. However these sanitize methods will do nothing if there is no index for the collection. 

Since this package relies highly on NodeJS's FS module much of the fs methods were written into promises to make use of promise methodologies. Since many instances needed custom work the use of a 3rd party promise fs library was not used.

```typescript
// ES6 options and available extensions
import { IStorageDriverExtended, TiteratorCB, // from the types direrctory
    GetItem, SetItem, Clear, FetchIndex, Iterate, Keys, RemoveItem, StoreIndex, RemoveIndex, ElectronStorage, indexCheck, // methods for the actual storage driver.
    AppDirectory, IAppDirectory, // from the AppDirectory directory
    
    // below are all the functions used in the package as utilities 
    // and FS replacements
    TruncateFile, OpenFile, MakeDir, CopyFile, AppendFile, CloseFile, FileStat, FileSync, FlushStorage,  IFlushStorageOptions, WriteFile, ReadFile, SafeWrite, safeReadFile,  IsafeReadFileOptions, parseJSON, stringifyJSON, EnsureDataFile, UnlinkFile, ReadDir, RmDir, LStat, ClearDirectory, CopyAndWrite, WriteNewPastandBase, MakeVersionDirPast, safeParse, RenameFile, removeBackup, safeStat, safeDirExists, safeRmDir, flattenStorageDriver, rmArrDupsStorageDriver,
} from 'tedb-electron-storage';
```
Exports with the key term `safe` will not reject and instead return `false` for mistakes. This is useful in the package for cross platform errors such as reading files that do not exist. More on the files error handling could be implemented in the future.

## Table of Contents

* <a href="#installation">Installation</a>
* <a href="#usage">Usage</a>
* <a href="#storage-driver-upfront-info">Storage Driver Upfront Info</a>
* <a href="#using-tedb-and-tedb-electron-storage-in-tandem">Using TeDB and TeDB-Electron-Storage in Tandem</a>
* <a href="#creating-a-db-and-collection">Creating a DB and Collection</a>
* <a href="#utils-and-benefits-of-this-storage-driver">Utils and Benefits of this Storage Driver</a>


## Storage Driver Upfront Info
Since the use of this package is through [TeDB](https://github.com/tedb-org/teDB) then the explanation will be examples of using [TeDB](https://github.com/tedb-org/teDB) to create a meaningful api for your collections. This explanation will also be written in TypeScript; if you are using regular Javascript, nothing will change except possibly needing to downgrade the ES version to ES5 and removing the type annotations which come after a `:`.

It is also important to know the limitations of this storage driver. Currently there is no insert buffer for inserting large amounts of documents. Since each document has its own file this takes time for the OS to create the files. To insert 10k items on my 2015 mac took 13 seconds. However all other operations on 100k collections took under 50ms even if there was no index. With indices however you will get results for a find/update/remove within 1-2ms depending on how many fields are searched. For each key in a query a search is a composed. Then cross referenced and compacted down to the remaining results. So the less keys in the query the faster the search.

As for the saving location on your desktop, you can check out the AppDirectory directory and read the index file.
* For Mac your data will be saved at `user/Library/ApplicationSupport/collectionName`. 
* For Windows `user\AppData\Local\collectionName`. 
* And for linux `user/local/share/collectionName`.

There you can query your data within that directory. A db for your application might look like 
```text
 > collectionName -> name of your db
      |
       > db -> db dir for possible db duplications or other version extensions in the future 
      .  | 
      .   > users -> collection you named and pushed data to
      .  .    | 
      .  .     > username_index.db
      .  .     > NW03UVRHQUJBQUE9T3IyT0xTK2FlaTQ9T2FOVEdxcE5lRG89aWowa0NLS3pVdWM9.db
      .  .     > ... 
      .  .     > `v0.0.1 -> version directory
      .  .     .    |
      .  .     .     > states -> another sub directory for version updates # note below about this
      .  .     .    .    |
      .  .     .    .     > NW03UVRHQUJBQUE9T3IyT0xTK2FlaTQ9T2FOVEdxcE5lRG89aWowa0NLS3pVdWM9 -> dir of backup of doc
      .  .     .    .    .      |
      .  .     .    .    .       > past -> file containing previous state of doc
      .  .     .    .     > username_index -> dir of backup of index
      .  .     .    .    .      |
      .  .     .    .    .       > past -> file containing previous state of index
      .  .     .    .     > otherBackups...
      .   > otherCollections...    
``` 

Now about why the version in the db directory is not the same as the package version. This is to possibly allow me to update the backup directories methodology without affecting your base data. If you update this package and see that the version number changed for that directory then there was a breaking change to how the data is laid out in the older version to the current. Items in the version directory are for the use of the database would recommend against tampering with the backup data. This does mean that your data is backup up and that your data is duplicated on disk. 

I might work in a way in the future to opt out of this choice but it is an extra safety measure for lost data when desktops randomly crash and there is not time to finish the current write. Write to files overwrite completely. This means every update will overwrite the file and the past info lives on in the backup until the next update. This package does make use of the graceful-fs as dependency preventing many common errors with file accessing. So if you notice that a find is taking a very long time possibly you have no index and a very large query with many many keys. This will open up many files if your collection is very large and will bottleneck the IO. Graceful-fs will convert the async nature of this package to synchronous if to many files are being opened at once. Having indices will prevent this from happening. 

If you are wondering why the choice of singe files for documents was made for this package check out the information given in the parent package [TeDB writing a storage driver](https://github.com/tedb-org/teDB#writing-a-storage-driver-for-tedb).  

## Using TeDB and TeDB-Electron-Storage in Tandem
It is important to understand that [TeDB](https://github.com/tedb-org/teDB) is simply the in memory handler of the indices and _ids which are the keys to files in this package; and that TeDB-Electron-Storage is used for file IO operations. Using both together in certain circumstances and at the right time is key to creating a robust api for your DB. During development it is useful to have the Storage driver's methods available for debugging your DB. However it is not recommended unless completely confident in your ability to use the Storage Driver methods except for the `removeIndex` method.

## Creating a DB and Collection
To view the the methods available to you visit the `types/index` file and look through methods and their descriptions. They should explain their purpose. If not this go through of a good DB collection should be useful.

Here I will create class to describe a collection and what DB it should be apart of. Along with promise based events.
```typescript
// imports
import {ElectronStorage, IStorageDriverExtended} from 'tedb-electron-storage';
import {Datastore, Cursor, IindexOptions, IupdateOptions, Index} from 'tedb';
//
// type and default for event
export type Tevent = (obj: any) => Promise<any>;
const ret = (i: any): Promise<any> => new Promise((resolve) => resolve(i));
export const PRESAVE = 'preSave';
export const POSTSAVE = 'postSave';
export const PREUPDATE = 'preUpdate';
export const POSTUPDATE = 'postUpdate';
export const PREFETCH = 'preFetch';
export const POSTFETCH = 'postFetch';
export const PREREMOVE = 'preRemove';
export const POSTREMOVE = 'postRemove';
export const PREPOST = 'prePost';
export const POSTPOST = 'postPost';
//
// class interface 
export interface ICollection {
    Storage: IStorageDriverExtended;
    Datastore: Datastore;
    collName: string;
    get(query: any): Promise<any>;
    save(doc: any): Promise<any>;
    find(query: any): Cursor;
    count(query: any): Cursor;
    update(query: any, operation: any, options: IupdateOptions): Promise<any>;
    remove(query: any): Promise<number>;
    indexField(options: IindexOptions): Promise<null>;
    removeIndex(fieldName: string): Promise<null>;
    PersistIndices(): Promise<null>;
    PersistIndex(fieldName: string): Promise<null>;
    LoadIndex(key: string, index: any[]): Promise<null>;
    getIndices(): Promise<any>;
}
//
// Events for collection
export interface Ievents {
    preSave: Tevent;
    postSave: Tevent;
    preUpdate: Tevent;
    postUpdate: Tevent;
    preFetch: Tevent;
    postFetch: Tevent;
    preRemove: Tevent;
    postRemove: Tevent;
    preSync: Tevent;
    postSync: Tevent;
    prePost: Tevent;
    postPost: Tevent;
    [key: string]: Tevent;
}
//
// class  
export class Collection implements ICollection {
    public Storage: IStorageDriverExtended;
    public Datastore: Datastore;
    public events: Ievents;
    public collName: string;
    
    constructor(collection: string) {
        this.Storage = new ElectronStorage('YourDBName', collection);
        this.Datastore = new Datastore({storage: this.Storage});
        this.collName = collection;
        this.events = {
            preSave: ret,
            postSave: ret,
            preUpdate: ret,
            postUpdate: ret,
            preFetch: ret,
            postFetch: ret,
            preRemove: ret,
            postRemove: ret,
            preSync: ret,
            postSync: ret,
            prePost: ret,
            postPost: ret,
        };
    }  
    /**
     * Set the method an event should use.
     * @param {string} event
     * @param {Tevent} cb
     */
    public setEvent(event: string, cb: Tevent) {
        this.events[event] = cb;
    }

    /**
     * Depending on the given string execute an event method
     * @param {string} event
     * @param param
     * @returns {Promise<any>}
     */
    public event(event: string, param: any): Promise<any> {
        return this.events[event](param);
    }
    
    /**
     * return only one document. doc as any needed because
     * return type of the find method is number | Promise<any>
     * @param query
     * @returns {Promise<any>}
     */
    public get(query: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let document: any;
            this.event(PREFETCH, query)
                .then(() => this.Datastore.find(query).limit(1).exec())
                .then((doc) => {
                    document = doc;
                    return this.event(POSTFETCH, document[0]);
                })
                .then(() => resolve(document[0]))
                .catch(reject);
        });
    }

    /**
     * Persist a document
     * @param doc
     * @returns {Promise<any>}
     */
    public save(doc: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let document: any;
            this.event(PRESAVE, doc)
                .then((changedDoc) => {
                    return this.Datastore.insert(changedDoc);
                })
                .then((res) => {
                    document = res;
                    return  this.event(POSTSAVE, document);
                })
                .then(() => this.PersistIndices())
                .then(() => resolve(document))
                .catch(reject);
        });
    }

    /**
     * Get all documents matching query. uses indices if any
     * @param query
     * @returns {Cursor}
     */
    public find(query: any): Cursor {
        return this.Datastore.find(query);
    }

    /**
     * Get the count of a find query
     * @param query
     * @returns {Cursor}
     */
    public count(query: any): Cursor {
        return this.Datastore.count(query);
    }

    /**
     * Update documents
     * @param query - Uses find method
     * @param operation - $set, $inc, $mul, $unset, $rename
     * @param options - multi, upsert, returnUpdatedDocs
     * @returns {Promise<any>}
     */
    public update(query: any, operation: any, options: IupdateOptions): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const update = {query, operation, db: this, options};
            let documents: any;
            this.event(PREUPDATE, update)
                .then((updateObj) => this.Datastore.update(updateObj.query, operation, options))
                .then((docs) => {
                    // can't emit post update without returned docs
                    if (options.returnUpdatedDocs) {
                        documents = docs;
                        const postUpdate = {docs, operation, db: this, options};
                        return this.event(POSTUPDATE, postUpdate);
                    } else {
                        return null;
                    }
                })
                .then(() =>  this.PersistIndices())
                .then(() => {
                    if (options.returnUpdatedDocs) {
                        resolve(documents);
                    } else {
                        resolve();
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Removes documents by query. then persist index
     * @param query
     * @returns {Promise<number>}
     */
    public remove(query: any): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            let num: number;
            this.event(PREREMOVE, query)
                .then(() => this.Datastore.remove(query))
                .then((res) => {
                    num = res;
                    return this.Datastore.sanitize();
                })
                .then(() => this.event(POSTREMOVE, query))
                .then(() => this.PersistIndices())
                .then(() => {
                    if (num) {
                        resolve(num);
                    } else {
                        resolve();
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Create index on a field of a document. can be nested 'path.to.key'
     * @param options - fieldName, unique, compareKeys, checkKeyEquality
     * @returns {Promise<null>}
     */
    public indexField(options: IindexOptions): Promise<null> {
        return new Promise<null>((resolve, reject) => {
            this.Datastore.ensureIndex(options)
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * Deletes index from memory and from storage
     * @param fieldName
     * @returns {Promise<null>}
     */
    public removeIndex(fieldName: string): Promise<null> {
        return new Promise<null>((resolve, reject) => {
            this.Datastore.removeIndex(fieldName)
                .then(() => this.Storage.removeIndex(fieldName)) // here is where you would use removeIndex from the Storage Driver
                .then(resolve)
                .catch(reject);
        });
    }

    public PersistIndices(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.getIndices()
                .then((indices) => {
                    const promises: Array<Promise<null>> = [];                    
                    indices.forEach((v: Index, k: string) => {
                        promises.push(this.Datastore.saveIndex(k));
                    });
                    return Promise.all(promises);
                })
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * Persist an index to storage
     * @param fieldName
     * @returns {Promise<null>}
     * @constructor
     */
    public PersistIndex(fieldName: string): Promise<null> {
        return new Promise<null>((resolve, reject) => {
            this.Datastore.saveIndex(fieldName)
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * Insert a stored index into the datastore, best used with
     * fetch index then, ensureIndex, then load Index if exists.
     * @param key
     * @param index
     * @returns {Promise<null>}
     * @constructor
     */
    public LoadIndex(key: string, index: any[]): Promise<null> {
        return this.Datastore.insertIndex(key, index);
    }

    /**
     * Return the indices of this datastore is a Map
     * @returns {Promise<any>}
     */
    public getIndices(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.Datastore.getIndices()
                .then(resolve)
                .catch(reject);
        });
    }
}
```

If You would like after using the `this.Datastore.getIndices` method it returns the Map of indices you may choose to use this to loop over the indices
```typescript
.then((indices) => {
   return Promise.all(Array.from(indices).map(([key, value]) => {
       // here the value is the Index from TeDB
       // and key is the key for the index ie: username.
       // this is used in the remove method of TeDB to remove an index item from
       // each index
       return value.remove(document); // which document is the document to be removed
   })) 
})
```

Here for example I will show the method for a `Users` collection.
```typescript
import { FieldIndexer, IndexLoader, IndexChecker, PRESYNC, POSTSYNC, Collection} from './DB'; // DB is where the DB above is

export const USERS: string = 'Users';

const User: Collection = new Collection(USERS);
const uniqIndices: string[] = ['username'];
const nonUniqIndices: string[] = ['age'];
//
// promise for event fired
const promise1 = (col: Collection): Promise<null> => { // has to resolve null
    return new Promse((resolve, reject) => {
        return null; // here you could do operation on the collection on events
    });
};
const promise2 = promise1;
//
// adding event to the collection
User.setEvent(PRESYNC, promise1);
User.setEvent(POSTSYNC, promise2);
// 
//
export const Users = (): Promise<Collection> => {
    return new Promise<Collection>((resolve, reject) => {
        let hasIndex: boolean;
        IndexChecker(User) // possible method to check if User has any indices in storage on load up of Database
            .then((bool) => {
                hasIndex = bool;
                if (bool) {
                    return User;
                } else {
                    return FieldIndexer(User, uniqIndices, true); // would ensure you index
                }
            })
            .then((col) => FieldIndexer(User, nonUniqIndices, false)) // ensure another
            .then((col) => {
                if (hasIndex) {
                    return col;
                } else {
                    return IndexLoader(col as Collection, uniqIndices); // load index from storage. -> col.Storage.fetchIndex !! another time to use the Storage Driver method directly
                }
            })
            .then(resolve)
            .catch(reject);
    });
};
```

## Utils and Benefits of this Storage Driver
The utilities are very much tied to this package and don't see much being updated to them unless more error handling fixes come about. Some methods will be removed from this package and other packages under the tedb-org to create a new tedb-org/tedb-utils package in the future which will have all the utils and their tests all on one localized place. 

The benefits of using this package and TeDB are that it is written in TypeScript and all the types are available. Also TypeScript can be used to create an `interface` or `type` that acts as a schema for your collection. Once you query data you simply state the return type as the `type/interface` you declared. TeDB and this package will store your object exactly as you send it so there are no modifications to your object during save. 

There is one thing I have to say about this package and that is don't blame the package right away for errors and issues. When creating your own database logically think about the way it is functioning before submitting an error. 

This package and TeDB are both being used in production for Electron. As issues come up we will be available to discussion and fixes if need be. If this package does not suite your needs please create your own and make a pull request to TeDB to add it to our list of Storage Drivers. A React Native storage driver is in the future so keep an eye out.
