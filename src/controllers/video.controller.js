import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"



const getAllVideos = asynchandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    
   
    const matchConditions = {
        isPublished: true 
    };
    
    
    if (query) {
        matchConditions.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }
    
    
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID");
        }
        matchConditions.owner = new mongoose.Types.ObjectId(userId);
    }
    
   
    const sortOptions = {};
    if (sortBy && sortType) {
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    } else {
        
        sortOptions.createdAt = -1;
    }
    
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    
    const videos = await Video.aggregate([
        {
            $match: matchConditions
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
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                ownerDetails: 1
            }
        }
    ]);
    
    // Get total count for pagination
    const totalVideos = await Video.countDocuments(matchConditions);
    
    // Calculate pagination metadata
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
                "Videos fetched successfully"
            )
        );
});

const publishAVideo = asynchandler(async (req, res) => {
    const { title, description} = req.body;
    const {videoFile,thumbnail}=req.files;
    if (
    [title,description].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  if(!videoFile || !thumbnail){
    throw new ApiError(400,"All fields are required")
  }
  const video = await uploadOnCloudinary(videoFile);
  const thumb = await uploadOnCloudinary(thumbnail);
  const vdo = await Video.create({
    title,
    description,
    videoFile: video.url,
    thumbnail:thumb.url,
    duration:video.duration,   
    owner:req.userId
  });

  if(!vdo){
    throw new ApiError(500,"Something went wrong while uploading")
  }
   return res
    .status(201)
    .json(new ApiResponse(200, vdo, "Video uploaded Succesfully"));   
})

const getVideoById = asynchandler(async (req, res) => {
    
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }

    const video=await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"Not found");
    }

    return res
    .status(201)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
})

const updateVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description}=req.body;
   if (!title && !description && !req.file) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateFields={}

    if(title) updateFields.title=title;
    if(description) updateFields.description=description
    
    const existingVideo=await Video.findById(videoId);
    if(!existingVideo){
        throw new ApiError(404,"Video not found")
    }

    if (existingVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    
    if(req.file){
        const thumbnailLocalPath=req.file.path;
        const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);
        
        if(!thumbnail.url){
            throw new ApiError(400,"Error while uploading thumbnail");
        }
      updateFields.thumnail=thumbnail.url;
    }


    const video=await Video.findByIdAndUpdate(
    videoId,
    {
      $set:updateFields
    },
    {new:true}

  )
  
    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));


})

const deleteVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"not a valid id")
    }

    const video=await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }
    
    await Video.findByIdAndDelete(videoId);
    await deleteFromCloudinary(video.videoFile);
    await deleteFromCloudinary(video.thumbnail);



    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video deleted sucessfully"))

})

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Not a valid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to change this video's status");
    }

    
    video.isPublished = !video.isPublished; 
    await video.save({ validateBeforeSave: false }); 

    return res
        .status(200)
        .json(new ApiResponse(200, { isPublished: video.isPublished }, "Publish status toggled successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}