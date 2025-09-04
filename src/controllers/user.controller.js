import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";

// It's wrapped inside 'asynchandler' so that if the async function throws an error,
// it gets caught and passed to 'next()' instead of crashing the server.....
const registerUser=asynchandler(async(req,res)=>{
   //Steps to register user
   //1.getting the user details thru frontend
   //2.Validation(did user left the email empty or stuff)
   //3.check if user already exists:username ,email..
   //4.check for images,check for avatar
   //5.upload them to cloudinary,avatar
   //6.create user object(because for uploading data to mongodb or any non-sql databases,we send it in an object form)--create entry in db
   //7.remove password and refresh token field from response(Now, when you send back a response to the frontend after registration, you don’t want to expose sensitive info like:password or refresh token)
   //8.check for user creation
   //9.return response
    
   const {fullName,email,username,password}=req.body
   console.log("email :",email);
   
})

export {registerUser}