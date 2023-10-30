import { MongoClient } from "mongodb";

let database;

export const DatabaseModule = {
  connectToDatabase: (callback) => {
    MongoClient.connect(process.env.DB_URI)
      .then((client) => {
        database = client.db();
        console.log("Connected to the database 📦");
        return callback();
      })
      .catch((error) => {
        console.error("Error connecting to the database ❌", error);
        return callback(error);
      });
  },

  getDatabase: () => database,
};
