import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"


const healthcheck = asynchandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    return res
    .status(200)
    .json(new ApiResponse(200,{ status: "OK" },"Everything is okay"))
})

export {
    healthcheck
    }
    