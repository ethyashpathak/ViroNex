import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const userRouter=Router()

userRouter.route("/register").post(registerUser);
//userRouter.route("/login").post(registerUser);


export default userRouter