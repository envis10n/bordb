declare interface IObjectAny {
    [key: string]: any;
}

declare interface IBorDBOptions {
    saveInterval: number;
}

declare interface IBorDBManifest {
    savedAt: number;
    collections: string[];
}

declare interface IBorCollectionStore {
    [key: string]: any;
    name: string;
    data: IBorDoc[];
    savedAt: number;
}

declare interface IBorDoc {
    [key: string]: any;
    _key: string;
}

declare type Option<T> = T | null;
