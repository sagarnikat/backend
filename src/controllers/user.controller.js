import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/Apierror.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/fileupload.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { jwt } from "jsonwebtoken";

// options for cookies
const options ={
    httpOnly : true,
    secure : true
}

const generateAccessAndRefereshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }

}

const registerUser = asyncHandler( async (req,res) => {
    
    // collect data
    const {fullName,email,username,password} = req.body
    // console.log("username: ",req)

    // validation - not empty
    if(
        [fullName,email,username,password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400,"all fields is required")
    }

    // user alrady exist
    const existingUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existingUser){
        throw new ApiError(409,"User already exist")
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
        throw new ApiError(400,"Avatar is required")
    }

    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
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
        throw new ApiError(500,"someting went wrong while creating user")
    }

    // return responce
    return res.status(201).json(
        new ApiResponse(200, createdUser,"user registerd succesfully")
    )
})

const loginUser = asyncHandler( async (req,res) =>{
    // collect data
    // console.log(req.body)
    const  {username , password , email} = req.body

    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }
    if(!password){
        throw new ApiError(400,"password is required")
    }

    // find the user
    // username or email
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User not found")
    }
    
    // password cheack
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"incorrect password")
    }

    // acces and refreshtocken
    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send responce
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            }
            ,"user logedin succesfuly")
    ) 
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res) =>{
    // collect refresh token
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(404,"refreshToken not found")
    }

    try {
        // validate refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!incomingRefreshToken){
            throw new ApiError(401,"invalid refreshToken")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refreshtoken does't match")
        }
    
        // generate accestoken
        const {newAccessToken,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
        // send accestoken to user
        return res
        .status(200)
        .cookie("accessToken",newAccessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    newAccessToken,refreshToken : newRefreshToken
                }
                ,"access token refressed succesfuly")
        )
    } catch (error) {
        throw new ApiError(401,error?.massage || "error while handling refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
    
}