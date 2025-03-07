import { ElasticSearchCustom } from "./helpers/elastic_search";
import { prisma } from "./helpers/prisma";

export async function indexToElasticSearch(videoId: number): Promise<boolean> {
    try {
        const video = await prisma.videos.findFirst({
            where: {
                id: videoId
            }
        });
        if (!video) {
            return true;
        }
        const elasticSearchClient = await ElasticSearchCustom.getInstance();
        console.log(`Indexing video with id = ${video.id}`);

        elasticSearchClient.index({
            index: "videos",
            document: {
                id: video.id,
                creator_id: video.creator_id,
                title: video.title,
                created_at: video.created_at
            }
        })
        return true;
    } catch (err) {
        return false;
    }
}
