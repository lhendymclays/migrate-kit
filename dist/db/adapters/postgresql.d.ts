import pg from "pg";
import type { Database, SqlResult, SqlRecord, Queryable } from "../database.js";
import type { Config } from "../../config/config.js";
import { SqlValue } from "../sql_value.js";
import type { Migration } from "../../migrations/index.js";
export declare class PostgresqlDatabase implements Database {
    pool: pg.Pool;
    client: pg.PoolClient | undefined;
    config: Config;
    constructor(config: Config);
    /**
     * Opens connection to database
     * @returns {Promise<this>}
     * @throws {Error}
     */
    connect(): Promise<this>;
    /**
     * Closes database connection
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Executes sql query
     * @param {string} sqlQuery
     * @returns {Promise<PostgresqlResult>}
     */
    query(sqlQuery: string): Promise<PostgresqlResult>;
    /**
     * Performs sql operations inside a transaction
     * @param {(database: PostgresqlDatabase) => Promise<any>} callback
     * @returns {Promise<any>}
     */
    transaction(callback: (database: Queryable) => Promise<any>): Promise<any>;
    /**
     * Initializes migration table if not found
     * @returns {Promise<void>}
     */
    initMigrationTable(): Promise<void>;
    /**
     * Returns all migrations as map, with filename as the key
     * @returns {Promise<Map<string, Migration>>}
     */
    loadMigrationTableMap(): Promise<Map<string, Migration>>;
    /**
     * Returns all migrations as an array
     * @returns {Promise<Migration[]>}
     */
    loadMigrationTableArray(): Promise<Migration[]>;
}
export declare class PostgresqlRecord implements SqlRecord {
    raw: any;
    constructor(record: any);
    get(key: string): SqlValue | undefined;
}
export declare class PostgresqlResult implements SqlResult {
    private result;
    private isOk;
    private err;
    constructor(result: pg.QueryResult<any> | Error);
    ok(): boolean;
    error(): Error | undefined;
    rows(): PostgresqlRecord[];
    length(): number;
}
//# sourceMappingURL=postgresql.d.ts.map