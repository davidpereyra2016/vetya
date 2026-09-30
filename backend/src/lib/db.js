import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 30),
            minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),
            serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000),
            socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
        });
        console.log("Connected to MongoDB", `${conn.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);//termina el proceso
    }
};
