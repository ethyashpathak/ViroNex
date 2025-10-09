import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const createTweet = asynchandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
    if(!content || !content.trim()){
        throw new ApiError(400,"Content field is required")
    }
    const tweet= await Tweet.create({
        content,
        owner:req.user._id
    })
    if(!tweet){
        throw new ApiError(500,"Something went wrong")
    }
    return res
    .status(201)
    .json(new ApiResponse(200, tweet, "Tweet uploaded Succesfully")); 

})

const getUserTweets = asynchandler(async (req, res) => {
    // TODO: get user tweets

})

const updateTweet = asynchandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params;
    const {content}=req.body;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401,"not a valid id")
    }
    const existingTweet=await Tweet.findById(tweetId)
    if(!existingTweet){
        throw new ApiError(404,"Tweet not found")
    }
    if(existingTweet.owner.toString()!=req.user._id.toString()){
        throw new ApiError(403,"You are not Authorized to update this tweet")
    }

    const tweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
          $set:{
            content:content
          }
        },
        {new:true}
    
      )
       return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
})

const deleteTweet = asynchandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401,"not a valid id")
    }

    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"Not found")
    }

    if(tweet.owner.toString()!=req.user._id.toString()){
        throw new ApiError(403,"You are not Authorized to update this tweet")
    }
    
    await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(201)
    .json(new ApiResponse(200,{},"tweet deleted sucessfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}