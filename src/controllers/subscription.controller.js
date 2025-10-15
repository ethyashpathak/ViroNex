import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"


const toggleSubscription = asynchandler(async (req, res) => {
    const {channelId} = req.params
     if (!isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid video ID");
        }
        
        
        const existingsub = await Subscription.findOne({
            channel: channelId,
            subscriber: req.user._id
        });
        
        if (existingsub) {
            
            await Subscription.findByIdAndDelete(existingsub._id);
            
            return res
                .status(200)
                .json(new ApiResponse(200, { isSubscribed: false }, "Channel unsubcribed successfully"));
        } else {
           
            const subcribed = await Subscription.create({
                channel: channelId,
                subscriber: req.user._id
            });
            
            return res
                .status(201)
                .json(new ApiResponse(201, { isSubscribed: true, subcribed }, "Channel subcribed successfully"));
        }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    
    
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
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
            $unwind: "$subscriberDetails"
        },
        {
            $sort: {
                createdAt: -1
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
                subscriberDetails: 1,
                createdAt: 1
            }
        }
    ]);
    
   
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
    const totalPages = Math.ceil(totalSubscribers / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscribers,
                    subscriberCount: totalSubscribers,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalSubscribers,
                        limit: limitNumber,
                        hasNextPage,
                        hasPrevPage
                    }
                },
                "Subscribers fetched successfully"
            )
        );
});
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    //Validate subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }
    
    // Check if user exists
    const user = await User.findById(subscriberId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Get subscribed channels with their details
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscriberCount: { $size: "$subscribers" }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            subscriberCount: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $sort: {
                createdAt: -1
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
                channelDetails: 1,
                createdAt: 1
            }
        }
    ]);
    
    // Get total count
    const totalSubscribed = await Subscription.countDocuments({ subscriber: subscriberId });
    const totalPages = Math.ceil(totalSubscribed / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscribedChannels,
                    subscribedCount: totalSubscribed,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalSubscribed,
                        limit: limitNumber,
                        hasNextPage,
                        hasPrevPage
                    }
                },
                "Subscribed channels fetched successfully"
            )
        );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}