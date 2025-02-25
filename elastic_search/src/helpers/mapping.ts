import { ElasticSearchCustom } from './elastic_search';

export async function createMapping() {
    const client = await ElasticSearchCustom.getInstance();
    try {
        const videosIndex = await client.indices.create({
            index: "videos",
            body: {
                mappings: {
                    properties: {
                        id: {
                            type: "integer"
                        },
                        creator_id: {
                            type: "integer"
                        },
                        title: {
                            type: "search_as_you_type",
                        },
                        created_at: {
                            type: "date"
                        }
                    }
                }
            }
        });

        console.log(`Index videos created with mappings`);
        console.log(videosIndex);
    } catch (error: any) {
        console.error(`Failed to create index: ${error.message}`);
    }
}

