import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export const PresetsCollection = new Mongo.Collection("presets");

if (Meteor.isServer) {
  Meteor.publish("presets", function () {
    return PresetsCollection.find({});
  });

  Meteor.methods({
    "presets.insert"(data) {
      if (!data.name || typeof data.name !== "string") {
        throw new Meteor.Error("invalid-argument", "Preset name is required");
      }
      if (!data.schemaKey || typeof data.schemaKey !== "string") {
        throw new Meteor.Error("invalid-argument", "Schema key is required");
      }
      if (!data.blocks || !Array.isArray(data.blocks)) {
        throw new Meteor.Error("invalid-argument", "Blocks array is required");
      }
      return PresetsCollection.insertAsync({
        name: data.name,
        schemaKey: data.schemaKey,
        blocks: data.blocks,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },

    "presets.update"(id, data) {
      if (!id) throw new Meteor.Error("invalid-argument", "ID is required");
      const $set = { updatedAt: new Date() };
      if (data.name) $set.name = data.name;
      if (data.schemaKey) $set.schemaKey = data.schemaKey;
      if (data.blocks) $set.blocks = data.blocks;
      return PresetsCollection.updateAsync(id, { $set });
    },

    "presets.remove"(id) {
      if (!id) throw new Meteor.Error("invalid-argument", "ID is required");
      return PresetsCollection.removeAsync(id);
    },
  });
}
