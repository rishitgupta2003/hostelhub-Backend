import mongoose from "mongoose";
import { DB_NAME } from "../contants.js";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(
            `${process.env.DATABASE_URI}/${DB_NAME}`
        );
        console.log(`DATABASE CONNECTED!!! DB HOST: ${connectionInstance.connection.host}`);
    
    }catch(err){
        console.log("CONNECTION FAILED", err);
        process.exit(1);
    }
}

export { connectDB };