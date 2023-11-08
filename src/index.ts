import { Command, flags } from "@oclif/command";
import { MongoClient, Collection } from "mongodb";
import { faker } from "@faker-js/faker";

type Replacement = {
  field: string;
  replacement: string;
};

class MongodbAnonymizer extends Command {
  static description = "describe the command here";

  static flags = {
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    uri: flags.string({ char: "u", description: "mongodb source" }),
    targetUri: flags.string({ char: "t", description: "mongodb target" }),
    list: flags.string({
      char: "l",
      description: "list of columns to anonymize",
      default:
        "email,name,description,address,city,country,phone,comment,birthdate",
    }),
    ignoreDocuments: flags.string({
      char: "i",
      description:
        "documents from these collections will be ignored (comma separated)",
    }),
  };
  async run() {
    const { flags } = this.parse(MongodbAnonymizer);
    if (!flags.uri || !flags.targetUri) {
      this.error(
        "You must specify a source and a target uri (type -h for help)"
      );
    }

    const ignoreDocuments = flags.ignoreDocuments?.split(",") || [];

    this.log("Connecting to source…");
    const client = new MongoClient(flags.uri);
    await client.connect();
    const db = client.db();

    this.log("Connecting to target…");
    const targetClient = new MongoClient(flags.targetUri);
    await targetClient.connect();
    const targetDb = targetClient.db();

    this.log("Getting collections…");
    const collections = await db.listCollections().toArray();
    this.log("Collections: " + collections.map((item) => item.name));

    this.log("Anonymizing collections…");
    for (const collection of collections) {
      const collectionName = collection.name;

      if (ignoreDocuments.includes(collectionName)) {
        this.log("Ignoring collection: " + collectionName);
        // drop collection if it exists
        if ((await targetDb.collection(collectionName).countDocuments()) > 0) {
          await targetDb.collection(collectionName).drop();
        }
        continue;
      }

      this.log("Anonymizing collection: " + collectionName);
      this.log("Cleaning up target collection: " + collectionName);
      await targetDb.collection(collectionName).deleteMany({});
      const sourceCollection = await db
        .collection(collectionName);
      const targetCollection = await targetDb
        .collection(collectionName);
      const list = flags.list.split(",");
      await this.anonymizeCollection(
        sourceCollection,
        targetCollection,
        collectionName,
        list
      );
    }
    this.log("Done!");

    await client.close();
    await targetClient.close();
  }
  async anonymizeCollection(
    sourceCollection: Collection<any>,
    targetCollection: Collection<any>,
    collectionName: string,
    list: string[]
  ) {
    const keysToAnonymize = list
      .filter(
        (item) =>
          !item.match(/^[a-z_]+\./gi) || item.startsWith(`${collectionName}.`)
      )
      .map((item) => ({
        field: item
          .replace(`${collectionName}.`, "")
          .replace(/:(?:.*)$/, "")
          .toLowerCase(),
        replacement: item.includes(":") ? item.replace(/^(?:.*):/, "") : null,
      }));
    const fieldsToAnonymize = keysToAnonymize.map((item) => item.field);
    this.log(`Fields to anonymize: ${fieldsToAnonymize}`);
    for await (const document of sourceCollection.find()) {
      if(!document) continue;
      const documentAnonymized = this.anonymizeMap(document, "", fieldsToAnonymize, keysToAnonymize);
      await targetCollection.insertOne(documentAnonymized);
    }
  }

  anonymizeMap(map: object, prefix: string, fieldsToAnonymize: string[], keysToAnonymize: Replacement[]) {
    const anonymized = {};
    for (const key in map) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (fieldsToAnonymize.includes(fullKey.toLowerCase())) {
        anonymized[key] = this.anonymizeValue(
          key.toLowerCase(),
          keysToAnonymize.find((item) => item.field === fullKey.toLowerCase())
            ?.replacement
        );
      } else {
        if(key != '_id' && typeof map[key] === "object") {
          anonymized[key] = this.anonymizeMap(map[key], fullKey, fieldsToAnonymize, keysToAnonymize);
        }
        else {
          anonymized[key] = map[key];
        }
      }
    }
    return anonymized;
  }

  anonymizeValue(key: any, replacement) {
    if (replacement) {
      // Anonymize when key is like: `email:faker.internet.email`
      if (replacement.startsWith("faker")) {
        const [_one, two, three] = replacement.split(".");
        if (!(two && three)) return replacement;
        return faker[two][three]();
      } else if (replacement === "[]") {
        return [];
      } else if (replacement === "{}") {
        return {};
      } else if (replacement.startsWith("[") || replacement.startsWith("{")) {
        return JSON.parse(decodeURIComponent(replacement));
      } else if (replacement === "null") {
        return null;
      }
      // Anonymize when key is like: `email:raph@example.org`
      return replacement;
    }
    if (key.includes("email"))
      return faker.internet.email();
    if (key.includes("firstname")) return faker.person.firstName();
    if (key.includes("lastname")) return faker.person.lastName();
    if (key === "description") return faker.lorem.sentence();
    if (key.endsWith("address")) return faker.location.streetAddress();
    if (key.endsWith("city")) return faker.location.city();
    if (key.endsWith("country")) return faker.location.country();
    if (key.endsWith("phone")) return faker.phone.number();
    if (key.endsWith("comment")) return faker.lorem.sentence();
    if (key.endsWith("date")) return faker.date.past();
    if (key.endsWith("name")) return faker.person.fullName();
    return faker.lorem.word();
  }
}

export = MongodbAnonymizer;
