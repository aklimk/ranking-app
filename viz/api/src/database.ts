import { forceEnvVar } from "./tools.js"
import { Pool } from "pg";

export const pool = new Pool({
  host: process.env["PG_HOST"],
  port: parseInt(forceEnvVar(process.env["PG_PORT"])),
  database: forceEnvVar(process.env["PG_DB"]),
  user: forceEnvVar(process.env["PG_USER"]),
  password: forceEnvVar(process.env["PG_PASSWORD"]),
  allowExitOnIdle: true,
});
