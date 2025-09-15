import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  const avatarLocalPath = req.files?.avatar[0]?.path;

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

  if (!username) {
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
  
  await generateAccessTokenandRefreshToken(user._id)

});

export { registerUser };
