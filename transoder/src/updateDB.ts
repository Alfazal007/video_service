import { prisma } from "./prisma";

export async function updateDBAndTellIfNeedToUpdateMaster(videoId: number, publicKeyOfMaster: string): Promise<[boolean, boolean]> {
    try {
        const updatedVideo = await prisma.videos.update({
            where: {
                id: videoId
            },
            data: {
                status: "published",
                normal_done: true
            }
        });

        if (updatedVideo.foureighty_done) {
            console.log("Need to update master file");
            return [true, true];
        }
        console.log("Don't update master file");
        return [true, false];
    } catch (err) {
        return [false, false];
    }
}
