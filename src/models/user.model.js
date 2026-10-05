import mongoose from "mongoose";
import jwt  from "jsonwebtoken";
import bcrypt from "bcrypt"

const UserSchema = new mongoose.Schema(
    {
        username:{
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
        },
        email:{
            type : String,
            required : true,
            lowercase : true,
            unique : true,
            trim : true,
        },
        fullName:{
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar:{
            type: string, // claoudinary url
            required: true,
        },
        coverImage:{
            type: string, // claoudinary url
        },
        watchHistory:{
            type: mongoose.Schema.Types.ObjectId,
            ref : "Vedio"
        },
        password:{
            type : String,
            required : [true,"password is required"],
            trim : true,
        },
        refreshToken: {
            type : string,
        }
    },{timestamps: true}
)

UserSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password,10)
    next()
})

UserSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username: this.username,
            fullName: this.fullName
        }, process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = new mongoose.model("User",UserSchema) 