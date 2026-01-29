import { knex as setupKnex, Knex } from 'knex'
import { env } from './env/index'

// knex configuration object
//how the application connects to the database
export const config: Knex.Config = {
    // Database client (sqlite, pg, mysql)
    client: env.DATABASE_CLIENT,

    // Database connection settings
    // SQLite uses a file path, other databases use a connection URL
    connection:
        env.DATABASE_CLIENT === 'sqlite3'
            ? {
                filename: env.DATABASE_URL,
            }
            : env.DATABASE_URL,

    // Required for SQLite to avoid warnings with default null values
    useNullAsDefault: true,

    // Migration configuration
    migrations: {
        // Use TypeScript files for migrations
        extension: 'ts',

        // Directory where migration files are stored
        directory: './db/migrations',
    },
}

// Create and export a Knex instance using the configuration above
export const knex = setupKnex(config)