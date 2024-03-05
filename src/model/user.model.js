import {Schema, model} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
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
            required: [true,  "Password Required"]
        },
        phoneNum: {
            type: String,
            required: true
        },
        avatar: {
            type: String, //linkOfAvatar
        },
        refreshToken: {
            type: String
        },
        hostel_name: {
            type: String,
            enum: ["NekChand/Zakir", "SUKHNA", "TAGORE", "GGS/NorthCampus"],
            default: "NekChand/Zakir"
        }

    },
    
    {
        timestamps: true
    }
)


userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hashSync(this.password, process.env.SALT_ROUNDS);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

export const User = model("User",userSchema);