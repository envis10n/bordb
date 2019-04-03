import cbor from "cbor";

export default class BorCollection {
    public static fromStore(store: IBorCollectionStore): BorCollection {
        return new BorCollection(store.name, store.data);
    }
    private data: Map<string, IBorDoc> = new Map();
    constructor(public readonly name: string, data: IBorDoc[] = []) {
        for (const record of data) {
            this.data.set(record._key, record);
        }
    }
    public insert(document: IBorDoc | IBorDoc[]) {
        if (document instanceof Array) {
            for (const doc of document) {
                if (!this.data.get(doc._key)) {
                    this.data.set(doc._key, doc);
                } else {
                    throw new Error("Duplicate keys are not allowed.");
                }
            }
        } else {
            if (!this.data.get(document._key)) {
                this.data.set(document._key, document);
            } else {
                throw new Error("Duplicate keys are not allowed.");
            }
        }
    }
    public remove(handle: IBorDoc | string): boolean {
        if (typeof handle === "string") {
            if (this.data.get(handle)) {
                this.data.delete(handle);
                return true;
            }
        } else {
            if (this.data.get(handle._key)) {
                this.data.delete(handle._key);
                return true;
            }
        }
        return false;
    }
    public find(filter: IObjectAny, limit: number = 0): IBorDoc[] {
        const res: IBorDoc[] = [];
        for (const entry of this.data) {
            const doc = entry[1];
            if (!(Object.keys(filter).some((key) => {
                return filter[key] !== doc[key];
            }))) {
                res.push(doc);
            }
        }
        return res;
    }
    public findOne(filter: IObjectAny): Option<IBorDoc> {
        const res = this.find(filter, 1);
        if (res.length === 1) {
            return res[0];
        } else {
            return null;
        }
    }
    public replace(handle: string | IBorDoc, document: IBorDoc) {
        let key: string;
        if (typeof handle === "string") {
            if (handle === document._key) {
                key = handle;
            } else {
                throw new Error("Handle must match _key of document provided.");
            }
        } else {
            if (handle._key === document._key) {
                key = handle._key;
            } else {
                throw new Error("Handle must match _key of document provided.");
            }
        }
        const doc = this.data.get(key);
        if (doc !== undefined) {
            this.data.set(key, document);
        } else {
            throw new Error("Document does not exist.");
        }
    }
    public update(filter: IObjectAny, update: IObjectAny) {
        const docs = this.find(filter);
        for (const doc of docs) {
            for (const k of Object.keys(update).filter((e) => e !== "_key")) {
                doc[k] = update[k];
            }
        }
    }
    public updateOne(handle: string | IBorDoc, update: IObjectAny) {
        let key: string;
        if (typeof handle === "string") {
            key = handle;
        } else {
            key = handle._key;
        }
        const doc = this.data.get(key);
        if (doc !== undefined) {
            for (const k of Object.keys(update).filter((e) => e !== "_key")) {
                doc[k] = update[k];
            }
        } else {
            throw new Error("Document does not exist.");
        }
    }
    public iter(): IBorDoc[] {
        return Array.from(this.data).map((e) => e[1]);
    }
    public serialize(): Buffer {
        const data = Array.from(this.data).map((e) => e[1]);
        const collection: IBorCollectionStore = {
            name: this.name,
            data,
            savedAt: Date.now(),
        };
        return cbor.encode(collection);
    }
}
