import { Router } from "express";
import { registerUser,loginUser,logoutUser,refreshAccessToken } from "../controllers/user.controller.js";
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


export default userRouter