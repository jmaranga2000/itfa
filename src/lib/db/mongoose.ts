import mongoose, { type Mongoose } from "mongoose";
import { getServerEnv } from "@/lib/env";

type MongooseCache = {
  connection: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache =
  globalWithMongoose.mongooseCache ??
  (globalWithMongoose.mongooseCache = {
    connection: null,
    promise: null,
  });

export async function connectToDatabase() {
  if (cache.connection) {
    return cache.connection;
  }

  const { MONGODB_URI } = getServerEnv();

  cache.promise ??= mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });

  cache.connection = await cache.promise;
  return cache.connection;
}
