import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export const SchemasCollection = new Mongo.Collection("schemas");

if (Meteor.isServer) {
  Meteor.publish("schemas", function () {
    return SchemasCollection.find({});
  });

  Meteor.methods({
    "schemas.insert"(data) {
      if (!data.name || typeof data.name !== "string") {
        throw new Meteor.Error("invalid-argument", "Schema name is required");
      }
      if (!data.schema || typeof data.schema !== "object") {
        throw new Meteor.Error("invalid-argument", "Schema definition is required");
      }
      return SchemasCollection.insertAsync({
        name: data.name,
        schema: data.schema,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },

    "schemas.update"(id, data) {
      if (!id) throw new Meteor.Error("invalid-argument", "ID is required");
      const $set = { updatedAt: new Date() };
      if (data.name) $set.name = data.name;
      if (data.schema) $set.schema = data.schema;
      return SchemasCollection.updateAsync(id, { $set });
    },

    "schemas.remove"(id) {
      if (!id) throw new Meteor.Error("invalid-argument", "ID is required");
      return SchemasCollection.removeAsync(id);
    },
  });
}
