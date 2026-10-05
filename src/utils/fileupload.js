import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (locaFilePath) => {
    try{
        if(!locaFilePath) return null;
        // upload the fle on cloudinary
        const responce = await cloudinary.uploader.upload(locaFilePath,{
            resource_type:'auto'            
        })
        // file uploded successfully
        console.log("file uploded successfully on cloudinary" , responce.url)
        return responce
    }catch(error){
        //  remove the locally saved temporary filr ad upload to cloud got failed
        fs.unlinkSync(locaFilePath)
        return null 
    }
}

export { uploadOnCloudinary }