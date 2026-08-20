export const config = () => ({
  app: {
    name: process.env.APP_NAME,
    url: process.env.APP_URL,
    port: process.env.APP_PORT || 3000,
  },
  //Postgres db configs
  database: {
    type: process.env.DATABASE_TYPE || 'postgres',
    name: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || '5432',
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },

  jwt: {
    secret_key: process.env.JWT_ACCESS_SECRET_KEY,
  },
  //ORM Configs
  synchronize_db_schema: process.env.ORM_SYNCHRONIZE_DB_SCHEMA,
  autoload_entities: process.env.ORM_AUTOLOAD_ENTITIES,
});
