import { PrismaClient } from "@prisma/client"

class PrismaClientGiver {
    private static instance: PrismaClient;
    private constructor() {
    }

    static getInstance(): PrismaClient {
        if (!this.instance) {
            this.instance = new PrismaClient();
        }
        return this.instance;
    }
}

export const prisma = PrismaClientGiver.getInstance();
