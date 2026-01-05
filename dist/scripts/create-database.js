"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
async function createDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL no está definida en el archivo .env');
        process.exit(1);
    }
    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port || '5432';
    const client = new pg_1.Client({
        host,
        port: parseInt(port),
        user: username,
        password,
        database: 'postgres',
    });
    try {
        await client.connect();
        console.log('✅ Conectado a PostgreSQL');
        const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
        if (result.rowCount && result.rowCount > 0) {
            console.log(`ℹ️  La base de datos "${dbName}" ya existe`);
        }
        else {
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Base de datos "${dbName}" creada exitosamente`);
        }
    }
    catch (error) {
        console.error('❌ Error al crear la base de datos:', error);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
createDatabase().catch((error) => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
});
//# sourceMappingURL=create-database.js.map