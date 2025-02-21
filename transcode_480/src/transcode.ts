import axios from "axios";
import { deleteExistingFiles } from "./downloadVideo";
import { commandReturner } from "./new_commands";
import { exec } from "child_process";
import { v2 as cloudinary } from "cloudinary";
import { createCloudinaryData } from "./cloudinary";
import util from "util";
import { prisma } from "./prisma";

export async function transcodeVideo(videoId: number, credentials: string): Promise<[boolean, string]> {
    cloudinary.config({
        cloud_name: 'itachinftvr',
        api_key: process.env.CLOUDINARY_API_KEY as string,
        api_secret: process.env.CLOUDINARY_API_SECRET as string
    });

    try {
        const video = await prisma.videos.findFirst({
            where: {
                id: videoId
            }
        });
        if (!video) {
            return [true, ""];
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
        let videoUrl = `https://api.cloudinary.com/v1_1/itachinftvr/resources/video/upload/${publicId}`;
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
            return [true, ""];
        }

        const downloadResponse = await deleteExistingFiles();
        if (!downloadResponse) {
            return [false, ""];
        }

        let url = cloudinary.url(publicId, {
            resource_type: 'video',
            sign_url: true
        });

        let finalCommandToRun = commandReturner(url);

        const execPromise = util.promisify(exec);
        await execPromise(finalCommandToRun);
        const res = await createCloudinaryData(video.creator_id, videoId);
        if (!res) {
            return [false, ""];
        }
        return [true, video.creator_id.toString()];
    } catch (err) {
        // dont commit to kafka as there was an issue so try again later
        return [false, ""];
    }
}
