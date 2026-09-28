import { createRequire } from "node:module";
import path from "node:path";
import z from "zod";
import dotenv from "dotenv";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const require = createRequire(import.meta.url);

export type InputOptions = {
	env?: string;
	config?: string;
	azureKeyVaultUrl?: string;
	driver?: string;
	host?: string;
	user?: string;
	password?: string;
	database?: string;
	dir?: string;
};

export type Config = {
	driver: string;
	dir: string;
	database: {
		host: string;
		user: string;
		password: string;
		database: string;
		ssl: boolean;
	};
};

/**
 * Schema for config cjs file
 */
const configSchema = z.object({
	driver: z.string().default("mssql"),
	dir: z.string().default("migrations"),
	database: z.object({
		host: z.string(),
		user: z.string(),
		password: z.string(),
		database: z.string(),
		ssl: z.coerce.boolean().default(false)
	})
});

/**
 * Schema for env file
 */
const envSchema = z.object({
	MIGRATIONS_DIR: z.string().default("migrations"),
	DB_DRIVER: z.string().default("ms"),
	DB_HOST: z.string(),
	DB_USER: z.string(),
	DB_PASSWORD: z.string(),
	DB_DATABASE: z.string(),
	DB_SSL: z.coerce.boolean().default(false)
});

/**
 * Loads config details
 * @returns {Promise<Config>}
 * @throws {Error}
 */
export async function loadOptions(opts: InputOptions): Promise<Config> {
	try {
		let dir = "migrations";
		let driver = "mssql";
		let host = "";
		let user = "";
		let password = "";
		let database = "";
		let ssl = false;

		// Env File
		if (opts.env) {
			const env = loadEnv(opts.env);

			dir = env.dir ?? dir;
			driver = env.driver ?? driver;

			host = env.database.host ?? host;
			user = env.database.user ?? user;
			password = env.database.password ?? password;
			database = env.database.database ?? database;
			ssl = env.database.ssl ?? ssl;
		}

		// .config.cjs file
		if (opts.config) {
			const config = loadConfig(opts.config);

			dir = config.dir ?? dir;
			driver = config.driver ?? driver;

			host = config.database.host ?? host;
			user = config.database.user ?? user;
			password = config.database.password ?? password;
			database = config.database.database ?? database;
			ssl = config.database.ssl ?? ssl;
		}

		// Azure key vault
		if (opts.azureKeyVaultUrl) {
			const keyvault = await loadAzureKeyVault(opts.azureKeyVaultUrl);

			user = keyvault.username;
			password = keyvault.password;
		}

		// Cli
		if (opts.dir) dir = opts.dir;
		if (opts.driver) driver = opts.driver;
		if (opts.host) host = opts.host;
		if (opts.user) user = opts.user;
		if (opts.password) password = opts.password;
		if (opts.database) database = opts.database;

		return {
			driver,
			dir,
			database: {
				host,
				user,
				password,
				database,
				ssl
			}
		};
	} catch (err: unknown) {
		const errorPrefix = "loading options";

		if (err instanceof Error) {
			throw Error(`${errorPrefix}: ${err.message}`);
		} else {
			throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
		}
	}
}

function loadEnv(filePath: string) {
	const baseDir = process.env["INIT_CWD"] || process.cwd();

	const resolvedPath = path.isAbsolute(filePath)
		? filePath
		: path.resolve(baseDir, filePath);

	// Load env file
	const envRes = dotenv.config({ quiet: true, path: resolvedPath });
	if (envRes.error) {
		throw Error(envRes.error.message);
	}

	// Validate env file
	const parseRes = envSchema.safeParse(envRes.parsed);
	if (!parseRes.success) {
		throw Error(z.prettifyError(parseRes.error));
	}

	return {
		dir: parseRes.data.MIGRATIONS_DIR,
		driver: parseRes.data.DB_DRIVER,
		database: {
			host: parseRes.data.DB_HOST,
			user: parseRes.data.DB_USER,
			password: parseRes.data.DB_PASSWORD,
			database: parseRes.data.DB_DATABASE,
			ssl: parseRes.data.DB_SSL
		}
	};
}

/**
 * Loads config file
 * @param {string} filePath
 * @returns {Config}
 */
function loadConfig(filePath: string): Config {
	const baseDir = process.env["INIT_CWD"] || process.cwd();

	const resolvedPath = path.isAbsolute(filePath)
		? filePath
		: path.resolve(baseDir, filePath);

	const config = require(resolvedPath);

	// Validate config, default for module js file
	const parseRes = configSchema.safeParse(config?.default ?? config);
	if (!parseRes.success) {
		throw Error(z.prettifyError(parseRes.error));
	}

	return parseRes.data as Config;
}

/**
 * Loads azure key vault
 * @param {string} vaulUrl
 * @returns {Config}
 */
async function loadAzureKeyVault(vaulUrl: string): Promise<{
	username: string;
	password: string;
}> {
	const credential = new DefaultAzureCredential();
	const secretClient = new SecretClient(vaulUrl, credential);

	const [usernameSecret, passwordSecret] = await Promise.all([
		secretClient.getSecret("postgresql-username"),
		secretClient.getSecret("postgresql-password")
	]);

	const username = usernameSecret.value;
	const password = passwordSecret.value;

	if (!username)
		throw new Error("postgres username was noy found in key vault");
	if (!password)
		throw new Error("postgres username was noy found in key vault");

	return { username, password };
}
