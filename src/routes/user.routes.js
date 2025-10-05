import { Router } from "express";
import { registerUser
  ,loginUser
  ,logoutUser
  ,refreshAccessToken
  , changeCurrentPassword
  , getCurrentUser
  , updateAccountDetails
  , updateUserAvatar
  , updateUserCoverImage
  , getUserChannelProfile
  , getUserHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { ApiError } from "../utils/ApiError.js";

const userRouter=Router()

userRouter.route("/register").post(
    upload.fields([
      {
         name:"avatar",
         maxCount:1
      },
      {
        name:"coverImage",
        maxCount:1
      }
    ]),
    registerUser

);
userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyJWT,  logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword)
userRouter.route("/current-user").get(verifyJWT, getCurrentUser)
userRouter.route("/update-details").patch(verifyJWT, updateAccountDetails)
userRouter.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
userRouter.route("/change-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
userRouter.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
userRouter.route("/watch-history").get(verifyJWT, getUserHistory)

export default userRouter