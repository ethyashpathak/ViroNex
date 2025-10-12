import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const toggleVideoLike = asynchandler(async (req, res) => {
    const {videoId} = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });
    
    if (existingLike) {
        
        await Like.findByIdAndDelete(existingLike._id);
        
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video unliked successfully"));
    } else {
       
        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        });
        
        return res
            .status(201)
            .json(new ApiResponse(201, { isLiked: true, like }, "Video liked successfully"));
    }
});

const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });
     if (existingLike) {
        
        await Like.findByIdAndDelete(existingLike._id);
        
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Comment unliked successfully"));
    } else {
       
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        });
        
        return res
            .status(201)
            .json(new ApiResponse(201, { isLiked: true, like }, "Comment liked successfully"));
    }
})

const toggleTweetLike = asynchandler(async (req, res) => {
    const { tweetId } = req.params;
    
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
   
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });
    
    if (existingLike) {
       
        await Like.findByIdAndDelete(existingLike._id);
        
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Tweet unliked successfully"));
    } else {
       
        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        });
        
        return res
            .status(201)
            .json(new ApiResponse(201, { isLiked: true, like }, "Tweet liked successfully"));
    }
});
const getLikedVideos = asynchandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Aggregation pipeline to get liked videos with details
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
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
                        $project: {
                            title: 1,
                            description: 1,
                            thumbnail: 1,
                            videoFile: 1,
                            duration: 1,
                            views: 1,
                            ownerDetails: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $sort: {
                createdAt: -1 // Most recently liked first
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
                videoDetails: 1,
                createdAt: 1
            }
        }
    ]);
    
    // Get total count
    const totalLikedVideos = await Like.countDocuments({
        likedBy: req.user._id,
        video: { $exists: true, $ne: null }
    });
    
    const totalPages = Math.ceil(totalLikedVideos / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    likedVideos,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalLikedVideos,
                        limit: limitNumber,
                        hasNextPage,
                        hasPrevPage
                    }
                },
                "Liked videos fetched successfully"
            )
        );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}