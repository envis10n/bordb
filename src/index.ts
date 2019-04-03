import BorCollection from "./collection";
import fs from "fs-extra";
import path from "path";
import cbor from "cbor";
import { promisify as _p } from "util";

const exists = _p(fs.exists);

class BorDB {
    private collections: Map<string, BorCollection> = new Map();
    private manifestPath: string;
    constructor(public readonly root: string, private saveInterval: number = 30000) {
        if (!path.isAbsolute(root)) {
            throw new TypeError("Parameter `root` must be an absolute path.");
        }
        this.manifestPath = path.join(root, ".manifest");
        fs.ensureDirSync(root); // Ensure the directory exists.
        if (fs.existsSync(this.manifestPath)) {
            const manifest = cbor.decode(fs.readFileSync(this.manifestPath));
            this.load(manifest);
        } else {
            fs.ensureFileSync(this.manifestPath);
            fs.writeFileSync(this.manifestPath, cbor.encode({
                savedAt: Date.now(),
                collections: [],
            }));
            this.startSave();
        }
    }
    public collection(name: string): BorCollection {
        let collection = this.collections.get(name);
        if (!collection) {
            collection = new BorCollection(name);
            this.collections.set(collection.name, collection);
        }
        return collection;
    }
    private startSave() {
        setTimeout(async () => {
            const collections = Array.from(this.collections).map((e) => e[0]);
            const manifest: IBorDBManifest = {
                savedAt: Date.now(),
                collections,
            };
            for (const collection of Array.from(this.collections).map((e) => e[1])) {
                const colPath = path.join(this.root, "collections", collection.name + ".collection");
                await fs.ensureFile(colPath);
                await fs.writeFile(colPath, collection.serialize());
            }
            await fs.ensureFile(this.manifestPath);
            await fs.writeFile(this.manifestPath, cbor.encode(manifest));
            this.startSave();
        }, this.saveInterval);
    }
    private async load(manifest: IBorDBManifest) {
        for (const colname of manifest.collections) {
            const colPath = path.join(this.root, "collections", colname + ".collection");
            if (await exists(colPath)) {
                const colData: IBorCollectionStore = cbor.decode(await fs.readFile(colPath));
                const collection: BorCollection = BorCollection.fromStore(colData);
                this.collections.set(collection.name, collection);
            }
        }
        this.startSave();
    }
}

export = BorDB;
