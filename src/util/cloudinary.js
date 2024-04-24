import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        
        const response = await cloudinary.uploader.upload(localFilePath, 
            {
                resource_type: "image"
            }
        );

        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}



const soldOverlay = async ( soldStatus, coverImgPath ) => {
    try{
        if(soldStatus){
            const image = extractImageNameFromURL(coverImgPath);
            const img = cloudinary.url(image,
                {
                    transformation: [
                        {
                            width: 600,
                            height: 600,
                            crop: 'fill',
                            gravity: 'auto'
                        },
                        {
                            overlay: 'sold'
                        }
                    ]
                }
            )
            return img;
        }
    }catch(error){
        console.log(error);
        return coverImgPath;
    }
}

function extractImageNameFromURL(imageURL) {
    const parts = imageURL.split('/');
    const filenameWithExtension = parts[parts.length - 1];
    const filenameWithoutExtension = filenameWithExtension.split('.')[0];
    return filenameWithoutExtension;
}

export { uploadOnCloudinary, soldOverlay };