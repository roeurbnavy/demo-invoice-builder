import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

export const SampleDataCollection = new Mongo.Collection("sampleData");

if (Meteor.isServer) {
  Meteor.publish("sampleData", function () {
    return SampleDataCollection.find({});
  });

  Meteor.methods({
    "sampleData.insert"(data) {
      if (!data.name || typeof data.name !== "string") {
        throw new Meteor.Error("invalid-argument", "Sample data name is required");
      }
      if (!data.data || typeof data.data !== "object") {
        throw new Meteor.Error("invalid-argument", "Sample data payload is required");
      }
      return SampleDataCollection.insertAsync({
        name: data.name,
        data: data.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },

    "sampleData.update"(id, data) {
      if (!id) throw new Meteor.Error("invalid-argument", "ID is required");
      const $set = { updatedAt: new Date() };
      if (data.name) $set.name = data.name;
      if (data.data) $set.data = data.data;
      return SampleDataCollection.updateAsync(id, { $set });
    },

    "sampleData.remove"(id) {
      if (!id) throw new Meteor.Error("invalid-argument", "ID is required");
      return SampleDataCollection.removeAsync(id);
    },
  });
}
