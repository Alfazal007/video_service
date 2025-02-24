import { ElasticSearchCustom } from "./helpers/elastic_search";
import { prisma } from "./helpers/prisma";

export async function indexToElasticSearch(videoId: number): Promise<boolean> {
    try {
        console.log("Indexing ", videoId);
        const video = await prisma.videos.findFirst({
            where: {
                id: videoId
            }
        });
        if (!video) {
            return true;
        }
        const elasticSearchClient = await ElasticSearchCustom.getInstance();
        // TODO:: Index into the elastic search
        return true;
    } catch (err) {
        return false;
    }
}
