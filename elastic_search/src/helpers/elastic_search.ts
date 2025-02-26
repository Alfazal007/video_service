import { Client } from '@elastic/elasticsearch';
import fs from "fs"
import path from "path"

export async function elasticClient() {
    const certPath = path.join(__dirname, "../../certer.crt")
    const client = new Client({
        node: 'https://127.0.0.1:9200',
        auth: {
            username: process.env.ELASTIC_USER as string,
            password: process.env.ELASTIC_PASSWORD as string
        },
        tls: {
            ca: fs.readFileSync(certPath, "utf8")
        }
    });
    return client;
}


export class ElasticSearchCustom {
    private static instance: Client | null;

    private constructor() {
        ElasticSearchCustom.instance = null;
    }

    public static async getInstance(): Promise<Client> {
        if (!ElasticSearchCustom.instance) {
            ElasticSearchCustom.instance = await elasticClient();
        }
        return ElasticSearchCustom.instance;
    }
}
