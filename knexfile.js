// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export const development = {
  client: 'pg',
  connection: {
    database: 'cines',
    user: 'postgres',
    password: 'root',
  }
};