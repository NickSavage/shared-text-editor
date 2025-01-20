require('dotenv').config();
const { Client } = require('pg');

async function initializeDatabase() {
    // Connect to postgres database to create the app database
    const client = new Client({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: 'postgres', // Connect to default postgres database
    });

    try {
        await client.connect();
        
        // Check if database exists
        const res = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [process.env.POSTGRES_DB]
        );

        if (res.rows.length === 0) {
            // Database doesn't exist, create it
            await client.query(`CREATE DATABASE ${process.env.POSTGRES_DB}`);
            console.log(`Database ${process.env.POSTGRES_DB} created successfully`);
        } else {
            console.log(`Database ${process.env.POSTGRES_DB} already exists`);
        }
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run the initialization
initializeDatabase(); 