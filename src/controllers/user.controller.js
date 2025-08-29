import { asynchandler } from "../utils/asynchandler.js";

// It's wrapped inside 'asynchandler' so that if the async function throws an error,
// it gets caught and passed to 'next()' instead of crashing the server.....
const registerUser=asynchandler(async(req,res)=>{
    // Sending back a JSON response with HTTP status 200...
    res.status(200).json(
        {
            message:"ok",
        }
    )
})

export {registerUser}