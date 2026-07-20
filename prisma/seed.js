
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { seedHomeSections } from '../src/seeders/homepage.seeder.js';

const prisma = new PrismaClient();

async function main() {

    try {
        // ==================== SEED USERS ====================
        const users = await Promise.all([
            prisma.user.upsert({
                where: { email: 'admin@gmail.com' },
                update: {},
                create: {
                    email: 'admin@gmail.com',
                    password: await hashPassword('123456'),
                    name: 'Admin User',
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    isEmailVerified: true,
                },
            }),
            prisma.user.upsert({
                where: { email: 'coach@gmail.com' },
                update: {},
                create: {
                    email: 'coach@gmail.com',
                    password: await hashPassword('123456'),
                    name: 'Club Coach',
                    role: 'COACH',
                    status: 'ACTIVE',
                    isEmailVerified: true,
                },
            }),
            prisma.user.upsert({
                where: { email: 'provider@gmail.com' },
                update: {},
                create: {
                    email: 'provider@gmail.com',
                    password: await hashPassword('123456'),
                    name: 'Service Provider',
                    role: 'PROVIDER',
                    status: 'ACTIVE',
                    isEmailVerified: true,
                },
            }),
            prisma.user.upsert({
                where: { email: 'user@gmail.com' },
                update: {},
                create: {
                    email: 'user@gmail.com',
                    password: await hashPassword('123456'),
                    name: 'Regular User',
                    role: 'USER',
                    status: 'ACTIVE',
                    isEmailVerified: true,
                },
            }),
        ]);

        // ==================== SEED HOMEPAGE SECTIONS ====================
        await seedHomeSections();

        console.log(' All seeding completed successfully!');

    } catch (error) {
        console.error('\n Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();