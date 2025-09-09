import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// It's wrapped inside 'asynchandler' so that if the async function throws an error,
// it gets caught and passed to 'next()' instead of crashing the server.....
const registerUser = asynchandler(async (req, res) => {
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

  const { fullName, email, username, password } = req.body;
  console.log("email :", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "") //basically this means if after removing the spaces(trim function removes the spaces from start and end),there is something or not
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
 
  //const coverImageLocalPath=req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path
  }

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
   }
   
   
   const avatar=await uploadOnCloudinary(avatarLocalPath)
   const coverImage=await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
     throw new ApiError(400,"Avatar file is required")
   }
   
   const user=await User.create({
     fullName,
     avatar:avatar.url,
     coverImage:coverImage?.url || "",
     email,
     password,
     username:username.toLowerCase()
   })
   
   const createdUser=await User.findById(user._id).select(     //(step no.7 reference)now whenever a user is created in the database,Mongodb creates a id itself named '_id',so its pretty simple here that whenever a user is found then select password and refreshToken and omit them so they dont pop up in the response to the frontend....
      "-password -refreshToken"
   )
    
   if(!createdUser){
     throw new ApiError(500,"Something went wrong while registering the user")
   }
   
   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Succesfully")
   )

});

export { registerUser };
