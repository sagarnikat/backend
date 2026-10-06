import asyncHandler from "../utils/asyncHandler.js";
import {APIError} from "../utils/Apierror.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/fileupload.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res) => {
    
    // collect data
    const {fullName,email,username,password} = req.body
    // console.log("username: ",req)

    // validation - not empty
    if(
        [fullName,email,username,password].some((field) =>
        field?.trim() === "")
    ){
        throw new APIError(400,"all fields is required")
    }

    // user alrady exist
    const existingUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existingUser){
        throw new APIError(409,"User already exist")
    }

    // cheack for images and avatar
    //const avatarLocalPath = req.files?.avatar[0]?.path; 
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new APIError(400,"Avatar is required")
    }

    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new APIError(400,"Avatar is required")
    }

    // create a user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    
    //  remove password and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //  cheack for user creation
    if(!createdUser){
        throw new APIError(500,"someting went wrong while creating user")
    }

    // return responce
    return res.status(201).json(
        new ApiResponse(200, createdUser,"user registerd succesfully")
    )
})

export {registerUser}