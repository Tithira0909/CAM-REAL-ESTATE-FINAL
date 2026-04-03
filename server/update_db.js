const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDB() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cam_real_estate',
    });

    try {
        await pool.query("ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255) NULL");
        console.log("Added totp_secret column");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("Column totp_secret already exists.");
        else console.error(e);
    }

    try {
        await pool.query("ALTER TABLE users ADD COLUMN is_totp_enabled BOOLEAN DEFAULT FALSE");
        console.log("Added is_totp_enabled column");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log("Column is_totp_enabled already exists.");
        else console.error(e);
    }

    process.exit();
}
updateDB();
