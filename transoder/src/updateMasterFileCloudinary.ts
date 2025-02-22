import { masterFileData } from "./master_files";
import { Quality } from "./transcode";
import { v2 as cloudinary } from "cloudinary";

export async function updateMasterCloudinary(videoQuality: Quality, publicKeyOfMaster: string): Promise<boolean> {
    cloudinary.config({
        cloud_name: 'itachinftvr',
        api_key: process.env.CLOUDINARY_API_KEY as string,
        api_secret: process.env.CLOUDINARY_API_SECRET as string
    });
    try {
        if (videoQuality == Quality.v360) {
            return true;
        }
        const newContent = masterFileData(videoQuality);
        const dataUri = `data:text/plain;base64,${Buffer.from(newContent).toString('base64')}`;
        await cloudinary.uploader.upload(dataUri, {
            public_id: publicKeyOfMaster,
            resource_type: 'raw',
            overwrite: true
        });

        return true;
    } catch (error) {
        console.log({ error })
        return false;
    }
}
