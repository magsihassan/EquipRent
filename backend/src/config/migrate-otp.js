// Run only the 002_otp_verification.sql migration
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

const runMigration = async () => {
    try {
        console.log('Running OTP migration...');

        const sql = fs.readFileSync(
            path.join(__dirname, '../../migrations/002_otp_verification.sql'),
            'utf8'
        );

        await pool.query(sql);
        console.log('OTP migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
