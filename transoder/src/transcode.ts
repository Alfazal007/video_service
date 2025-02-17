import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { downloadVideo } from "./downloadVideo";

const prisma = new PrismaClient();

enum Quality {
    "v1080",
    "v720",
    "v480",
    "v360"
}

export async function transcodeVideo(videoId: number, credentials: string): Promise<boolean> {
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
        const cloudinaryResponse = await axios.get(`https://api.cloudinary.com/v1_1/itachinftvr/resources/video/upload/${publicId}`,
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

        let targets: { width: number, height: number }[] = [];
        if (width == 640 && height == 360) {
            videoQuality = Quality.v360;
            targets.push({ width: 640, height: 360 });
        } else if (width == 854 && height == 480) {
            videoQuality = Quality.v480;
            targets.push({ width: 640, height: 360 });
            targets.push({ width: 854, height: 480 });
        } else if (width == 1280 && height == 720) {
            videoQuality = Quality.v720;
            targets.push({ width: 640, height: 360 });
            targets.push({ width: 854, height: 480 });
            targets.push({ width: 1280, height: 720 });
        } else if (width == 1920 && height == 1080) {
            videoQuality = Quality.v1080;
            targets.push({ width: 640, height: 360 });
            targets.push({ width: 854, height: 480 });
            targets.push({ width: 1280, height: 720 });
            targets.push({ width: 1920, height: 1080 });
        } else if (width > 1920 && height > 1080) {
            videoQuality = Quality.v1080;
            targets.push({ width: 640, height: 360 });
            targets.push({ width: 854, height: 480 });
            targets.push({ width: 1280, height: 720 });
            targets.push({ width: 1920, height: 1080 });
        } else {
            videoQuality = Quality.v360;
            targets.push({ width: 640, height: 360 });
        }
        console.log({ targets });
        const downloadResponse = await downloadVideo(publicId);
        if (!downloadResponse) {
            return false;
        }
        console.log({ downloadResponse })
        // transcode the video
        // upload it back to cloudinary
        // commit to kafka
    } catch (err) {
        // dont commit to kafka as there was an issue so try again later
        return false;
    }
    return true;
}

