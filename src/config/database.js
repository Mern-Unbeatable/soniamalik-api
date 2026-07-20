import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['error'],
});

// Test database connection
export async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Graceful shutdown
export async function disconnectDatabase() {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
}

export default prisma;
