import { SqlServerDatabase } from "./adapters/microsoft_sql_server.js";
import { PostgresqlDatabase } from "./adapters/postgresql.js";
/**
 * Database adapter factory
 * @param {Config} config
 * @returns {Database}
 */
export function createDatabase(config) {
    switch (config.driver) {
        case "mssql":
            return new SqlServerDatabase(config);
        case "pg":
            return new PostgresqlDatabase(config);
        default:
            throw new Error(`Unsupported DB driver: ${config.driver}`);
    }
}
