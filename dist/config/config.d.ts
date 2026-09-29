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
    debug?: boolean;
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
 * Loads config details
 * @returns {Promise<Config>}
 * @throws {Error}
 */
export declare function loadOptions(opts: InputOptions): Promise<Config>;
//# sourceMappingURL=config.d.ts.map