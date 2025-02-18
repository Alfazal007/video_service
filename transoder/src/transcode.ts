import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { downloadVideo } from "./downloadVideo";
import { commandReturner } from "./commads";
import { exec } from "child_process";
import { v2 as cloudinary } from "cloudinary";
import { createCloudinaryData } from "./cloudinary";
import util from "util";

const prisma = new PrismaClient();

export enum Quality {
    "v1080",
    "v720",
    "v480",
    "v360"
}

export async function transcodeVideo(videoId: number, credentials: string): Promise<boolean> {
    cloudinary.config({
        cloud_name: 'itachinftvr',
        api_key: process.env.CLOUDINARY_API_KEY as string,
        api_secret: process.env.CLOUDINARY_API_SECRET as string
    });

    let videoQuality: Quality;
    try {
        const video = await prisma.videos.findFirst({
            where: {
                id: videoId
            }
        });
        if (!video) {
            return true;
        }
        if (video.status != "transcoding") {
            await prisma.videos.update({
                where: {
                    id: videoId
                },
                data: {
                    status: "transcoding"
                }
            });
        }

        const publicId = `${video.creator_id}/${video.id}`;
        let videoUrl = `https://api.cloudinary.com/v1_1/itachinftvr/resources/video/upload/${publicId}`
        const cloudinaryResponse = await axios.get(videoUrl,
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const width = cloudinaryResponse.data.width;
        const height = cloudinaryResponse.data.height;
        if (!width || !height) {
            // probably deleted or improper video, commit to kafka
            return true;
        }

        if (width == 640 && height == 360) {
            videoQuality = Quality.v360;
        } else if (width == 854 && height == 480) {
            videoQuality = Quality.v480;
        } else if (width == 1280 && height == 720) {
            videoQuality = Quality.v720;
        } else if (width == 1920 && height == 1080) {
            videoQuality = Quality.v1080;
        } else if (width > 1920 && height > 1080) {
            videoQuality = Quality.v1080;
        } else {
            videoQuality = Quality.v360;
        }

        const downloadResponse = await downloadVideo();
        if (!downloadResponse) {
            return false;
        }

        console.log({ downloadResponse })
        let url = cloudinary.url(publicId, {
            resource_type: 'video',
            sign_url: true
        });

        let finalCommandToRun = commandReturner(url, videoQuality);
        console.log({ finalCommandToRun });

        const execPromise = util.promisify(exec);
        await execPromise(finalCommandToRun);
        const res = await createCloudinaryData(video.creator_id, videoId);
        if (!res) {
            return false;
        }
        return true;
    } catch (err) {
        // dont commit to kafka as there was an issue so try again later
        return false;
    }
}
