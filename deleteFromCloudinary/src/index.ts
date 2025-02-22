import { configDotenv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

configDotenv();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function deleteResourceType(resourceType: string) {
    let deletedCount = 0;
    let hasMore = true;
    let nextCursor = null;

    while (hasMore) {
        const options = {
            max_results: 500,
            resource_type: resourceType,
            ...(nextCursor && { next_cursor: nextCursor })
        };

        console.log(`Fetching ${resourceType} resources...`);
        const result = await cloudinary.api.resources(options);
        console.log(`Found ${result.resources.length} ${resourceType} resources`);

        if (result.resources.length === 0) {
            break;
        }

        // @ts-ignore
        const publicIds = result.resources.map(resource => resource.public_id);
        console.log(`Attempting to delete ${publicIds.length} ${resourceType} resources`);

        const batchSize = 100;

        for (let i = 0; i < publicIds.length; i += batchSize) {
            const batch = publicIds.slice(i, i + batchSize);

            try {
                await cloudinary.api.delete_resources(batch, { resource_type: resourceType });
                console.log(`Deleted batch ${i / batchSize + 1}: ${batch.length} items`);
            } catch (error) {
                console.error(`Error deleting batch ${i / batchSize + 1}:`, error);
            }
        }

        deletedCount += publicIds.length;
        console.log(`Deleted ${deletedCount} ${resourceType} assets so far...`);

        hasMore = result.next_cursor;
        nextCursor = result.next_cursor;
    }

    return deletedCount;
}

async function deleteAllAssets() {
    try {
        console.log('Starting deletion process...');

        // Try to delete different types of resources
        const resourceTypes = ['image', 'video', 'raw'];
        let totalDeleted = 0;

        for (const resourceType of resourceTypes) {
            console.log(`Processing ${resourceType} resources...`);
            const deleted = await deleteResourceType(resourceType);
            totalDeleted += deleted;
            console.log(`Completed ${resourceType} deletion. Deleted ${deleted} assets.`);
        }

        console.log(`Successfully deleted ${totalDeleted} total assets from Cloudinary.`);

    } catch (error) {
        console.error('Error deleting assets:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

deleteAllAssets();
