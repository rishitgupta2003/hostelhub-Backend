import { Schema, model } from "mongoose";
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
            type: Number,
            required: true
        },
        avatar: {
            type: String, //linkOfAvatar
            default: "https://res.cloudinary.com/don5euayf/image/upload/default%20avatar.jpg"
        },
        refreshToken: {
            type: String
        },
        hostel_name: {
            type: String,
            enum: ["NekChand/Zakir", "SUKHNA", "TAGORE"],
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

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            name:this.name,
            email:this.email,
            uid:this.uid
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id   
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRES_TOKEN_EXPIRY
        }
    )
}

export const User = model("User",userSchema);