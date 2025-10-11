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
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Aggregation pipeline to get user tweets with owner details
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $sort: {
                createdAt: -1 // Newest tweets first
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        },
        {
            $project: {
                _id: 1,
                content: 1,
                owner: 1,
                ownerDetails: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);
    
    // Get total count for pagination
    const totalTweets = await Tweet.countDocuments({ owner: userId });
    const totalPages = Math.ceil(totalTweets / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    tweets,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalTweets,
                        limit: limitNumber,
                        hasNextPage,
                        hasPrevPage
                    }
                },
                "User tweets fetched successfully"
            )
        );
});

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