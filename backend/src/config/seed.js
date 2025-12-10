require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('./database');

const seedData = async () => {
    try {
        console.log('Seeding database...');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await query(
            `INSERT INTO users (email, phone, password_hash, role, first_name, last_name, is_verified, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO NOTHING`,
            ['admin@equiprent.com', '+923001234567', adminPassword, 'admin', 'System', 'Admin', true, true, true]
        );
        console.log('Admin user created: admin@equiprent.com / admin123');

        // Create owner user
        const ownerPassword = await bcrypt.hash('owner123', 10);
        const ownerResult = await query(
            `INSERT INTO users (email, phone, password_hash, role, first_name, last_name, company_name, city, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
            ['owner@equiprent.com', '+923002345678', ownerPassword, 'owner', 'Ahmed', 'Khan', 'Khan Equipment Co.', 'Lahore', true, true]
        );
        const ownerId = ownerResult.rows[0]?.id;
        console.log('Owner user created: owner@equiprent.com / owner123');

        // Create renter user
        const renterPassword = await bcrypt.hash('renter123', 10);
        await query(
            `INSERT INTO users (email, phone, password_hash, role, first_name, last_name, city, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO NOTHING`,
            ['renter@equiprent.com', '+923003456789', renterPassword, 'renter', 'Muhammad', 'Ali', 'Karachi', true, true]
        );
        console.log('Renter user created: renter@equiprent.com / renter123');

        // Create categories
        const categories = [
            { name: 'Excavators', description: 'Heavy excavation equipment', icon: '🏗️' },
            { name: 'Loaders', description: 'Front-end and backhoe loaders', icon: '🚜' },
            { name: 'Cranes', description: 'Mobile and tower cranes', icon: '🏗️' },
            { name: 'Bulldozers', description: 'Heavy-duty bulldozers', icon: '🚧' },
            { name: 'Compactors', description: 'Road rollers and compactors', icon: '🛣️' },
            { name: 'Dump Trucks', description: 'Articulated and rigid dump trucks', icon: '🚛' },
            { name: 'Forklifts', description: 'Industrial forklifts', icon: '📦' },
            { name: 'Concrete Equipment', description: 'Mixers, pumps, and vibrators', icon: '🧱' },
            { name: 'Generators', description: 'Power generators', icon: '⚡' },
            { name: 'Aerial Platforms', description: 'Boom lifts and scissor lifts', icon: '🔧' }
        ];

        for (const cat of categories) {
            await query(
                `INSERT INTO equipment_categories (name, description, icon)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
                [cat.name, cat.description, cat.icon]
            );
        }
        console.log('Categories created');

        // Get category IDs
        const catResult = await query('SELECT id, name FROM equipment_categories');
        const categoryMap = catResult.rows.reduce((acc, c) => ({ ...acc, [c.name]: c.id }), {});

        if (ownerId) {
            // Create sample equipment
            const equipment = [
                {
                    title: 'CAT 320 Excavator',
                    description: 'Powerful hydraulic excavator suitable for medium to large construction projects. Well maintained with low hours.',
                    brand: 'Caterpillar',
                    model: '320',
                    modelYear: 2021,
                    category: 'Excavators',
                    dailyRate: 45000,
                    weeklyRate: 270000,
                    city: 'Lahore',
                    latitude: 31.5204,
                    longitude: 74.3587,
                    hasOperator: true,
                    operatorRatePerDay: 5000
                },
                {
                    title: 'Komatsu Wheel Loader WA320',
                    description: 'Versatile wheel loader for material handling and loading operations. Excellent condition.',
                    brand: 'Komatsu',
                    model: 'WA320-7',
                    modelYear: 2020,
                    category: 'Loaders',
                    dailyRate: 35000,
                    weeklyRate: 210000,
                    city: 'Lahore',
                    latitude: 31.5497,
                    longitude: 74.3436,
                    hasOperator: true,
                    operatorRatePerDay: 4500
                },
                {
                    title: 'Mobile Crane 50 Ton',
                    description: '50 ton capacity mobile crane for heavy lifting. Certified and inspected.',
                    brand: 'Tadano',
                    model: 'GR-500EX',
                    modelYear: 2019,
                    category: 'Cranes',
                    dailyRate: 85000,
                    weeklyRate: 500000,
                    city: 'Islamabad',
                    latitude: 33.6844,
                    longitude: 73.0479,
                    hasOperator: true,
                    operatorRatePerDay: 8000
                },
                {
                    title: 'Caterpillar D6 Bulldozer',
                    description: 'Heavy-duty bulldozer for earthmoving and grading. Excellent pushing power.',
                    brand: 'Caterpillar',
                    model: 'D6',
                    modelYear: 2020,
                    category: 'Bulldozers',
                    dailyRate: 55000,
                    weeklyRate: 330000,
                    city: 'Karachi',
                    latitude: 24.8607,
                    longitude: 67.0011,
                    hasOperator: true,
                    operatorRatePerDay: 6000
                },
                {
                    title: 'Volvo Road Roller',
                    description: 'Tandem vibratory roller for road construction and compaction work.',
                    brand: 'Volvo',
                    model: 'DD120C',
                    modelYear: 2021,
                    category: 'Compactors',
                    dailyRate: 25000,
                    weeklyRate: 150000,
                    city: 'Lahore',
                    latitude: 31.4826,
                    longitude: 74.3138,
                    hasOperator: false
                }
            ];

            for (const eq of equipment) {
                await query(
                    `INSERT INTO equipment (
            owner_id, category_id, title, description, brand, model, model_year,
            daily_rate, weekly_rate, city, latitude, longitude, has_operator,
            operator_rate_per_day, is_approved, is_available, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT DO NOTHING`,
                    [
                        ownerId, categoryMap[eq.category], eq.title, eq.description, eq.brand,
                        eq.model, eq.modelYear, eq.dailyRate, eq.weeklyRate, eq.city,
                        eq.latitude, eq.longitude, eq.hasOperator, eq.operatorRatePerDay || null,
                        true, true, true
                    ]
                );
                console.log(`Equipment created: ${eq.title}`);
            }

            // Create sample operator
            await query(
                `INSERT INTO operators (
          owner_id, name, phone, experience_years, specializations, daily_rate, is_available
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING`,
                [ownerId, 'Rashid Ahmed', '+923004567890', 10, JSON.stringify(['Excavators', 'Loaders', 'Cranes']), 5000, true]
            );
            console.log('Sample operator created');
        }

        console.log('Seed data completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
