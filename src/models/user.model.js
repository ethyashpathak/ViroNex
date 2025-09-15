import { Schema } from "mongoose";
import {mongoose} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema=new Schema(
    {
       username:{
         type:String,
         required:true,
         unique:true,
         lowercase:true,
         trim:true,
         index:true
       },
       email:{
         type:String,
         required:true,
         unique:true,
         lowercase:true,
         trim:true,
       },
       fullName:{
         type:String,
         required:true,
         trim:true,
       },
       avatar:{
         type:String, //cloudinary_url
         required:true,
       },
       coverImage:{
          type:String,//cloudinary url
       },
       watchHistory:[
          {
              type:Schema.Types.ObjectId,
              ref:"Video"
          }
       ],
       password:{
         type:String,
         required:[true,"Password is required"],
       },
       refreshToken:{
        type:String
       }


    },
    {
        timestamps:true
    }
)
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    
    this.password=await bcrypt.hash(this.password,10)
    next();
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}
/*
  Access & Refresh Tokens (JWT):

  - generateAccessToken(): issues a short-lived JWT containing user info 
    (id, email, username, fullName). Used to authenticate API requests.

  - generateRefreshToken(): issues a long-lived JWT containing only user id.
    Used to silently obtain new access tokens after the old one expires.

  Real-world effect:
    Apps with refresh tokens keep users logged in by refreshing access tokens.
    Apps without refresh tokens force users to log in again once the token expires.
*/


userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
           _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
           expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken=function(){
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

export const User=mongoose.model("User",userSchema)
