require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function setupDatabase() {
    try {
        console.log("Connecting to MySQL server...");
        // Connect without a specific database to create it first
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log("Connected to MySQL server.");

        // Read and execute database.sql
        const sqlPath = path.join(__dirname, 'database.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        
        // Basic split by semicolon to run queries one by one
        const queries = sqlScript.split(';').filter(q => q.trim() !== '');

        for (let query of queries) {
            if (query.trim()) {
                await connection.query(query);
            }
        }
        
        console.log("Database initialized successfully!");
        
        await connection.query('USE cam_real_estate');

        // Seed Admin Account
        const seedEmail = 'tikkaofficialayo@gmail.com';
        const seedPass = 'Tithira@123';
        const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [seedEmail]);
        
        if (existingUser.length === 0) {
            console.log("Inserting seed admin user...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(seedPass, salt);
            await connection.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [seedEmail, hashedPassword]);
            console.log(`Admin user created: ${seedEmail}`);
        } else {
            console.log(`Admin user ${seedEmail} already exists.`);
        }
        
        await connection.end();
        console.log("Setup complete. You can now start the server.");
    } catch (err) {
        console.error("Error setting up the database:", err.message);
        console.log("Make sure MySQL is running and credentials in .env are correct.");
    }
}

setupDatabase();
