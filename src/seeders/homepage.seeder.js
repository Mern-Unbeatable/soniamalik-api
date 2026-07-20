
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultSections = [
    {
        page: "HOME",
        title: "Welcome to SportsHub",
        subtitle: "Your Premier Sports Platform",
        description: "Discover, connect, and excel in your favorite sports",
        isActive: true,
        order: 0,
        aboutImages: [],
        sectionTitle: "Why Choose Us",
        sectionSubTitle: "We make sports accessible for everyone",
        sportTitle: "Featured Sports",
        sportSubTitle: "Explore our wide range of sports activities",
    },
    {
        page: "ABOUT_US",
        title: "About SportsHub",
        subtitle: "Empowering Athletes and Sports Enthusiasts",
        description: "We are a community-driven platform dedicated to connecting sports enthusiasts, coaches, and athletes.",
        isActive: true,
        order: 1,
        aboutImages: [],
        founderInfo: "Founded in 2024 by sports enthusiasts who believe in making sports accessible to everyone.",
        sectionTitle: "Our Mission",
        sectionSubTitle: "Building a stronger sports community",
    },
    {
        page: "LANDING",
        title: "SportsHub",
        subtitle: "Where Sports Connect",
        description: "Join the fastest growing sports community",
        isActive: true,
        order: 2,
        aboutImages: [],
        sectionTitle: "Get Started",
        sectionSubTitle: "Start your sports journey today",
        sportTitle: "Popular Sports",
        sportSubTitle: "Find your sport and connect with others",
    },
    {
        page: "COLLABORATE",
        title: "Collaborate With Us",
        subtitle: "Partnerships & Opportunities",
        description: "Let's work together to grow the sports ecosystem",
        isActive: true,
        order: 3,
        aboutImages: [],
        sectionTitle: "Why Collaborate",
        sectionSubTitle: "Together we can achieve more",
        sportTitle: "Our Partners",
        sportSubTitle: "Trusted by leading sports organizations",
    },
];

export async function seedHomeSections() {
    console.log('  🌱 Seeding homepage sections...');

    for (const sectionData of defaultSections) {
        try {
            // Check if section exists
            const existing = await prisma.homeSection.findUnique({
                where: { page: sectionData.page },
            });

            if (existing) {
                console.log(`  ⚠️  Section for ${sectionData.page} already exists, checking for missing fields...`);

                // Update only if fields are null/empty
                const updateData = {};
                for (const [key, value] of Object.entries(sectionData)) {
                    if (existing[key] === null || existing[key] === undefined || existing[key] === '') {
                        updateData[key] = value;
                    }
                }

                if (Object.keys(updateData).length > 0) {
                    await prisma.homeSection.update({
                        where: { page: sectionData.page },
                        data: updateData,
                    });
                    console.log(`  ✅ Updated missing fields for ${sectionData.page}`);
                } else {
                    console.log(`  ✅ No missing fields to update for ${sectionData.page}`);
                }
            } else {
                await prisma.homeSection.create({
                    data: sectionData,
                });
                console.log(`  ✅ Created section for ${sectionData.page}`);
            }
        } catch (error) {
            console.error(`  ❌ Failed to seed ${sectionData.page}:`, error.message);
        }
    }

    console.log('  ✅ Homepage sections seeding completed!');
}

// Function to reset all sections to default (use with caution)
export async function resetHomeSections() {
    console.log('  🔄 Resetting homepage sections...');

    try {
        // First, delete all existing sections
        await prisma.homeSection.deleteMany({});
        console.log('  🗑️  Removed all existing sections');

        // Then seed fresh
        await seedHomeSections();
        console.log('  ✅ Reset completed!');
    } catch (error) {
        console.error('  ❌ Reset failed:', error.message);
        throw error;
    }
}

// Run directly if this file is executed
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    if (command === 'reset') {
        await resetHomeSections();
    } else {
        await seedHomeSections();
    }
}