import pg from "pg";
import type { Database, SqlResult, SqlRecord, Queryable } from "../database.js";
import type { Config } from "../../config/config.js";
import { SqlValue } from "../sql_value.js";
import type { Migration } from "../../migrations/index.js";

export class PostgresqlDatabase implements Database {
	pool: pg.Pool;
	client: pg.PoolClient | undefined;
	config: Config;

	constructor(config: Config) {
		this.config = config;
		this.pool = new pg.Pool({
			host: this.config.database.host,
			user: this.config.database.user,
			password: this.config.database.password,
			database: this.config.database.database,
			max: 1,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000,
			maxLifetimeSeconds: 60
		});
	}

	/**
	 * Opens connection to database
	 * @returns {Promise<this>}
	 * @throws {Error}
	 */
	async connect(): Promise<this> {
		try {
			this.client = await this.pool.connect();
			return this;
		} catch (err: unknown) {
			const errorPrefix = "connecting database";

			if (err instanceof Error) {
				throw Error(`${errorPrefix}: ${err.message}`);
			} else {
				throw Error(
					`${errorPrefix}: unknown error type: ${String(err)}`
				);
			}
		}
	}

	/**
	 * Closes database connection
	 * @returns {Promise<void>}
	 */
	async close(): Promise<void> {
		try {
			this.client?.release();
		} catch {}
	}

	/**
	 * Executes sql query
	 * @param {string} sqlQuery
	 * @returns {Promise<PostgresqlResult>}
	 */
	async query(sqlQuery: string): Promise<PostgresqlResult> {
		if (this.client === undefined) throw Error("client was undefined");

		return new PostgresqlResult(await this.client.query(sqlQuery));
	}

	/**
	 * Performs sql operations inside a transaction
	 * @param {(database: PostgresqlDatabase) => Promise<any>} callback
	 * @returns {Promise<any>}
	 */
	async transaction(
		callback: (database: Queryable) => Promise<any>
	): Promise<any> {
		if (this.client === undefined) throw Error("client was undefined");

		try {
			await this.client.query("BEGIN");

			const res = await callback(this.client);

			await this.client.query("COMMIT");

			return res;
		} catch (err: any) {
			await this.client.query("ROLLBACK");
			throw Error(`performing postgres transaction: ${err.message}`);
		}
	}

	/**
	 * Initializes migration table if not found
	 * @returns {Promise<void>}
	 */
	async initMigrationTable(): Promise<void> {
		try {
			await this.query(`
				CREATE TABLE IF NOT EXISTS migrations (
					id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
					name VARCHAR(255) NOT NULL UNIQUE,
					time_stamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
				);
			`);
		} catch (err: unknown) {
			const errorPrefix = "initializing migration table";

			if (err instanceof Error) {
				throw Error(`${errorPrefix}: ${err.message}`);
			} else {
				throw Error(
					`${errorPrefix}: unknown error type: ${String(err)}`
				);
			}
		}
	}

	/**
	 * Returns all migrations as map, with filename as the key
	 * @returns {Promise<Map<string, Migration>>}
	 */
	async loadMigrationTableMap(): Promise<Map<string, Migration>> {
		try {
			const res = await this.query(`
				SELECT id, name, time_stamp
				FROM migrations
				ORDER BY time_stamp DESC, id DESC, name DESC;
			`);

			const map: Map<string, Migration> = new Map();

			for (const row of res.rows()) {
				const id = row.get("id")?.toNumber();
				const name = row.get("name")?.toString();
				const timeStamp = row.get("time_stamp")?.toDate();

				if (id === undefined) {
					throw Error("id was not found");
				}
				if (name === undefined) {
					throw Error("name was not found");
				}
				if (timeStamp === undefined) {
					throw Error("time stamp was not found");
				}

				map.set(name, { id, name, timeStamp });
			}

			return map;
		} catch (err: unknown) {
			const errorPrefix = "loading migration table map";

			if (err instanceof Error) {
				throw Error(`${errorPrefix}: ${err.message}`);
			} else {
				throw Error(
					`${errorPrefix}: unknown error type: ${String(err)}`
				);
			}
		}
	}

	/**
	 * Returns all migrations as an array
	 * @returns {Promise<Migration[]>}
	 */
	async loadMigrationTableArray(): Promise<Migration[]> {
		try {
			const res = await this.query(`
				SELECT id, name, time_stamp
				FROM migrations
				ORDER BY time_stamp DESC, id DESC, name DESC;
			`);

			const array: Migration[] = [];

			for (const row of res.rows()) {
				const id = row.get("id")?.toNumber();
				const name = row.get("name")?.toString();
				const timeStamp = row.get("time_stamp")?.toDate();

				if (id === undefined) {
					throw Error("id was not found");
				}
				if (name === undefined) {
					throw Error("name was not found");
				}
				if (timeStamp === undefined) {
					throw Error("time stamp was not found");
				}

				array.push({ id, name, timeStamp });
			}

			return array;
		} catch (err: unknown) {
			const errorPrefix = "loading migration table array";

			if (err instanceof Error) {
				throw Error(`${errorPrefix}: ${err.message}`);
			} else {
				throw Error(
					`${errorPrefix}: unknown error type: ${String(err)}`
				);
			}
		}
	}
}

export class PostgresqlRecord implements SqlRecord {
	raw: any;

	constructor(record: any) {
		this.raw = record;
	}

	get(key: string): SqlValue | undefined {
		try {
			return new SqlValue(this.raw[key]);
		} catch {
			return undefined;
		}
	}
}

export class PostgresqlResult implements SqlResult {
	private result: pg.QueryResult<any> | undefined;
	private isOk: boolean;
	private err: Error | undefined;

	constructor(result: pg.QueryResult<any> | Error) {
		if (result instanceof Error) {
			this.isOk = false;
			this.err = result;
		} else {
			this.isOk = true;
			this.result = result;
		}
	}

	ok(): boolean {
		return this.isOk;
	}

	error(): Error | undefined {
		return this.err;
	}

	rows(): PostgresqlRecord[] {
		if (!this.result) throw Error("result was no ok");
		return this.result.rows.map((v) => new PostgresqlRecord(v));
	}

	length(): number {
		return this.rows().length;
	}
}
