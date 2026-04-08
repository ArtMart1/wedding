import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

function getMongoUri() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  return mongoUri;
}

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!global.__mongooseConnectionPromise) {
    global.__mongooseConnectionPromise = mongoose.connect(getMongoUri());
  }

  try {
    return await global.__mongooseConnectionPromise;
  } catch (error) {
    global.__mongooseConnectionPromise = undefined;
    throw error;
  }
}
