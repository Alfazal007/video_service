import { ElasticSearchCustom } from './elastic_search';

export async function createMapping() {
    const client = await ElasticSearchCustom.getInstance();
    try {
        const videosIndex = await client.indices.create({
            index: "movies",
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
                            fields: {
                                "fuzzy": {
                                    type: "text"
                                }
                            }
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

