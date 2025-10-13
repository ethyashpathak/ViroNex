import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const getChannelStats = asynchandler(async (req, res) => {
    const { channelId } = req.params;
    
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    
    const channelExists = await Video.findOne({ owner: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }
    
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
    
    const totalVideos = await Video.countDocuments({ owner: channelId });
    
    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
    ]);
    
    const totalViews = videoStats.length > 0 ? videoStats[0].totalViews : 0;
    
    const likeStats = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $match: {
                "videoDetails.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        }
    ]);
    
    const totalLikes = likeStats.length > 0 ? likeStats[0].totalLikes : 0;
    
    const commentStats = await mongoose.model('Comment').aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $match: {
                "videoDetails.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalComments: { $sum: 1 }
            }
        }
    ]);
    
    const totalComments = commentStats.length > 0 ? commentStats[0].totalComments : 0;
    
    const channelStats = {
        totalSubscribers,
        totalVideos,
        totalViews,
        totalLikes,
        totalComments
    };
    
    return res
        .status(200)
        .json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"));
});

const getChannelVideos = asynchandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;
    
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" },
                commentCount: { $size: "$comments" }
            }
        },
        {
            $sort: sortOptions
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
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                likeCount: 1,
                commentCount: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);
    
    const totalVideos = await Video.countDocuments({ owner: channelId });
    const totalPages = Math.ceil(totalVideos / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    videos,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalVideos,
                        limit: limitNumber,
                        hasNextPage,
                        hasPrevPage
                    }
                },
                "Channel videos fetched successfully"
            )
        );
});

export {
    getChannelStats,
    getChannelVideos
}