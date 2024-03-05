import {Schema, model} from "mongoose";

const userSchema = new Schema(
    {
        name : {
            type: String,
            required: true
            
        },
        uid : {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        gender: {
            type: String,
            required: true,
            enum: ["MALE","FEMALE","OTHER","RATHER NOT SAY"],
            default: "MALE"
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        avatar: {
            type: String, //linkOfAvatar
        },
        refreshToken: {
            type: String
        }

    },
    {timestamps: true}
)

const User = model("User",userSchema);