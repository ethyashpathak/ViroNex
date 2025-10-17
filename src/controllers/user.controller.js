import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessTokenandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken=refreshToken;
    user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}
    
  } catch (error) {
    throw new ApiError(500, "Internal System error,sorry");
  }
};

// It's wrapped inside 'asynchandler' so that if the async function throws an error,
// it gets caught and passed to 'next()' instead of crashing the server.....
const registerUser = asynchandler(async (req, res) => {
  // Steps to register user
  // 1. getting the user details thru frontend
  // 2. Validation(did user left the email empty or stuff)
  // 3. check if user already exists: username, email..
  // 4. check for images, check for avatar
  // 5. upload them to cloudinary, avatar
  // 6. create user object (because for uploading data to mongodb or any non-sql databases, 
  //    we send it in an object form) -- create entry in db
  // 7. remove password and refresh token field from response 
  //    (Now, when you send back a response to the frontend after registration, 
  //    you don’t want to expose sensitive info like: password or refresh token)
  // 8. check for user creation
  // 9. return response

  const { fullName, email, username, password } = req.body;
  console.log("email :", email);

  if (
    [fullName, email, username, password].some(
      (field) => field?.trim() === ""
    )
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

  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Succesfully"));
});

const loginUser = asynchandler(async (req, res) => {
  // req body->data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send as cookie

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Bad Request");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const pssword = await user.isPasswordCorrect(password);

  if (!pssword) {
    throw new ApiError(401, "User credentials invalid");
  }
  
  const{accessToken,refreshToken}=await generateAccessTokenandRefreshToken(user._id)

  const loggedinUser=await User.findById(user._id).select("-password -refreshToken");

  const options={
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedinUser,accessToken,refreshToken
      },
      "User logged In Successfully"
    )
  )

});

const logoutUser=asynchandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }
  )
  const options={
    httOnly:true,
    secure:true,
    SameSite: "none"
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User logged out"))
})

const refreshAccessToken=asynchandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken;
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized token")
  }

  try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
    const user=await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token");
    }
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used")
    }
    
    const options={
      httOnly:true,
      secure:true
    }
  
    const{accessToken,newrefreshToken}=await generateAccessTokenandRefreshToken(user._id)
  
     
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newrefreshToken},
        "Access Token refreshed"
      )
    )
  } catch (error) {
     throw new ApiError(401,error?.message|| "Invalid refresh token")
  }

})

const changeCurrentPassword=asynchandler(async(req,res)=>{
  const {oldPassword,newPassword,confPassword}=req.body

  const user=await User.findById(req.user?.id)
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
  
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")

  }
  if(newPassword!==confPassword){
     throw new ApiError(400,"Password doesnt match")
  }

  user.password=newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser=asynchandler(async(req,res)=>{
   return res
   .status(200)
   .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails=asynchandler(async(req,res)=>{
  const {fullName,email}=req.body
  
  if(!fullName || !email){
    throw new ApiError(400,"All fields are required")
  }

  const user=User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    {new:true}

  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))

})

const updateUserAvatar=asynchandler(async(req,res)=>{
   const avatarLocalPath=req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
   }
   const avatar=await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
   }
   const user=User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}

  ).select("-password")
  return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )

})

const updateUserCoverImage=asynchandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400,"Cover image is missing")
   }
   const coverImage=await uploadOnCloudinary(coverImageLocalPath)
   
   if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on avatar")
   }
   const user=User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}

  ).select("-password")

  return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile=asynchandler(async(req,res)=>{
  const {username}=req.params

  if(!username.trim()){
    throw new ApiError(400,"username is missing")
  }

  const channel=await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
       $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
       }
    },
    {
      $lookup:{
        from:"susbcriptions",
        localField:"_id",
        foreignField:"susbcriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelsSubscribedTo:{
           $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.users?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedTo:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ])
  if(!channel?.length){
    throw new ApiError(404,"channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
  )


})
const getUserHistory=asynchandler(async(req,res)=>{
   const user=await User.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(req.user)
      }
    },
    {
      $lookup:{
        from:"videos",
        localfield:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $project:{
              fullName:1,
              username:1,
              avatar:1
            }
          }
        ]
      }
    },
    {
      $addFields:{
        owner:{
          $first:"$owner"
        }
      }
    }
   ])
   
   return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch History fetched successfully"
    )
   )
})



export { registerUser 
  ,loginUser
  ,logoutUser
  ,refreshAccessToken
  ,changeCurrentPassword
  ,getCurrentUser
  ,generateAccessTokenandRefreshToken
  ,updateAccountDetails
  ,updateUserAvatar
  ,updateUserCoverImage
  ,getUserChannelProfile
  ,getUserHistory};

//the full explaination to the aggregation pipelines used in the getUserChannelProfile part.....
  /**
 * @description
 * This aggregation pipeline fetches a complete user channel profile.
 * It finds a user by their username and then attaches two key pieces of relational data:
 * 1. A list of all users who are subscribed to this channel (their "subscribers").
 * 2. A list of all channels this user is subscribed to (their "subscriptions").
 *
 * --- PIPELINE BREAKDOWN ---
 *
 * 1. $match:
 * - The first stage simply finds the one specific user document that matches
 * the provided username. This document is then passed to the next stage.
 *
 * 2. $lookup (First): Get the channel's subscribers.
 * - This answers the question: "Who is subscribed to this user?"
 * - It takes the user's `_id` and finds every document in the "subscriptions"
 * collection where the `channel` field matches that `_id`.
 * - Analogy: This is like getting a user's list of "Followers".
 *
 * 3. $lookup (Second): Get the channels this user is subscribed to.
 * - This answers the question: "Who does this user subscribe to?"
 * - It again uses the user's `_id` but this time finds every document in the
 * "subscriptions" collection where the `subscriber` field matches that `_id`.
 * - Analogy: This is like getting the list of users someone is "Following".
 *
 * Note: There are potential typos in the original code. `susbcriptions` should
 * likely be `subscriptions` and `susbcriber` should be `subscriber`.
 */