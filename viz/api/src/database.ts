import { forceEnvVar } from "./tools.js"
import { Pool } from "pg";

export const pool = new Pool({
  host: "database",
  port: 5432,
  database: forceEnvVar(process.env["PG_DB"]),
  user: forceEnvVar(process.env["PG_USER"]),
  password: forceEnvVar(process.env["PG_PASSWORD"]),
});
