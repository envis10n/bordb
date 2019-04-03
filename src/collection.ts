import cbor from "cbor";

export default class BorCollection extends Map<string, IBorDoc> {
    public static fromStore(store: IBorCollectionStore): BorCollection {
        return new BorCollection(store.name, store.data);
    }
    constructor(public readonly name: string, data: IBorDoc[] = []) {
        super();
        for (const record of data) {
            this.set(record._key, record);
        }
    }
    public insert(document: IBorDoc | IBorDoc[]) {
        if (document instanceof Array) {
            for (const doc of document) {
                if (!this.get(doc._key)) {
                    this.set(doc._key, doc);
                } else {
                    throw new Error("Duplicate keys are not allowed.");
                }
            }
        } else {
            if (!this.get(document._key)) {
                this.set(document._key, document);
            } else {
                throw new Error("Duplicate keys are not allowed.");
            }
        }
    }
    public remove(handle: IBorDoc | string): boolean {
        if (typeof handle === "string") {
            if (this.get(handle)) {
                this.delete(handle);
                return true;
            }
        } else {
            if (this.get(handle._key)) {
                this.delete(handle._key);
                return true;
            }
        }
        return false;
    }
    public find(filter: IObjectAny, limit: number = 0): IBorDoc[] {
        const res: IBorDoc[] = [];
        for (const entry of this) {
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
    public serialize(): Buffer {
        const data = Array.from(this).map((e) => e[1]);
        const collection: IBorCollectionStore = {
            name: this.name,
            data,
            savedAt: Date.now(),
        };
        return cbor.encode(collection);
    }
}
