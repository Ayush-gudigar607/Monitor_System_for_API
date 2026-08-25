import pg from "pg";
import config from "./index.js";
import logger from "./logger.js";

const { Pool } = pg;

class PostgresConnection {
  constructor() {
    this.pool = null;
  }

  getPool() {
    if (!this.pool) {
      this.pool = new Pool({
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.user,
        password: config.postgres.password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.pool.on("error", (err, client) => {
        logger.error("Unexpected error on idle client", err);
        process.exit(-1);
      });

      logger.info("PG Pool Created Successfully");
    }
    return this.pool;
  }

  async connect() {
    try {
      const pool = this.getPool();
      const client = await pool.connect();
      const result = await client.query("SELECT NOW()");
      client.release();
      logger.info(`Postgres Connected Successfully at ${result.rows[0].now}`);
    } catch (error) {
      logger.error("Postgres Connection Error", error);
      throw error;
    }
  }

  async close()
  {
    if(this.pool)
    {
        await this.pool.end();
        this.pool=null;
        logger.info("Postgres Pool Closed Successfully");
    }
  }

  async query(text,params)
  {
    const pool=this.pool;
    const start=Date.now();
    try {
        const result=await pool.query(text,params)
        const duration=Date.now()-start;
        logger.info(`Expected query:${text} with params:${params} took ${duration} ms`);
    } catch (error) {
        logger.error('Failed to exexute query',error);
        throw error;
    }
  }
}

export default new PostgresConnection();
