# migrate-kit

A simple, extensible database migration toolkit for Node.js.

`migrate-kit` helps you create and run database migrations with a consistent workflow across multiple database engines.

# Features

- Simple CLI interface

- First-class support for Microsoft SQL Server

- Extensible architecture for additional database drivers

- Flexible configuration via CLI, env files, or config files

# Installation

```
npm install -g migrate-kit
```

```
pnpm add -g migrate-kit
```

# Supported Databases

✅ Microsoft SQL Server

🚧 PostgreSQL (coming soon)

🚧 SQLite (coming soon)

# Usage

## Create a Migration

Generate a pair of migration files for the up and down migrations:

```
migrate-kit create create_table --dir db/migrations
```

This creates:

```
db/migrations/
├── create_table.up.sql
└── create_table.down.sql
```

## Run Up Migrations

#### Run all pending migrations using the default configuration:

```
migrate-kit up
```

#### Specify a Database Driver:

```
migrate-kit up --driver mssql
```

#### Specify a Migration Directory:

```
migrate-kit up --dir db/migrations
```

#### Load Configuration from an Environment File:

```
migrate-kit up --env .env.development
```

#### Load Configuration from a Config File:

```
migrate-kit up --config migratekit.config.js
```

#### Provide Connection Details via CLI Arguments:

```
migrate-kit up --host localhost --user admin --password pass1234 --database data
```

## Run Down Migrations

All configuration options available for up are also supported by down (for example: --driver, --dir, --env, --config, and connection parameters).

#### Run single down migration using the default configuration:

```
migrate-kit down
```

#### Run multiple down migrations using the default configuration:

```
migrate-kit down --num 5
```

# Roadmap

- [x] Microsoft SQL Server support

- [ ] PostgreSQL support

- [ ] SQLite support
