# Configuration Module

This directory contains the central configuration management system for the application. It is designed for modularity, type safety, and multi-environment support.

## Core Features

- **Multi-Environment Support**: Automatically loads `.env.development`, `.env.staging`, or `.env.production` based on `NODE_ENV`.
- **Zod Validation**: Ensures all environment variables are present and correctly formatted before the server starts.
- **Separated Configurations**: Config is split into specialized objects (DB, JWT, Server, WebSockets) located in the `_` directory to prevent code bloat.
- **Domain-Specific Selection**: Configure which database (MongoDB or PostgreSQL) each domain (Admin, Auth, User) should use.

## Directory Structure

```text
src/config/
├── _/                    # Private configuration objects
│   ├── db.config.ts      # MongoDB and PostgreSQL settings
│   ├── jwt.config.ts     # Security and token settings
│   ├── server.config.ts  # Port and environment settings
│   └── ws.config.ts      # WebSocket server settings
├── schema/
│   └── schema.ts         # Zod schema definitions for validation
├── utils/
│   ├── base.ts           # Central validation engine
│   └── envInit.ts        # Environment loader (dotenv logic)
├── index.ts              # Main entry point (re-exports everything)
└── README.md             # This file
```

## Practical Usage

### 1. Selecting the Databases

#### Project-Wide Connections

In your active `.env` file, set which databases the application should connect to during startup (comma-separated):

```bash
# Options: "mongodb", "postgresql", or "mongodb, postgresql"
DATABASE_TYPE="mongodb, postgresql"
```

#### Domain-Specific Usage

Assign a specific database to each domain to control where its data is stored/retrieved:

```bash
# Options: "mongodb" | "postgresql"
DATABASE_TYPE_ADMIN=postgresql
DATABASE_TYPE_AUTH=mongodb
DATABASE_TYPE_USER=mongodb
```

The application uses these values to determine which service implementation should be active for each domain.

### 2. Accessing Configuration

Always import from the main config index. You can destructure specific configuration objects as needed:

```typescript
import { dbConfig, jwtConfig, serverConfig } from '@/config/index.js'

// Accessing settings
console.log(dbConfig.type) // 'mongodb'
console.log(serverConfig.port) // 5000
```

### 3. Adding New Environment Variables

To add a new configuration setting:

1. Add the variable to your `.env` files.
2. Update the `envSchema` in `src/config/schema/schema.ts`.
3. Add the property to the appropriate specialized config file in `src/config/_/` (e.g., `server.config.ts`).

## Technical Workflow

1. **`utils/envInit.ts`** runs first to load the physical `.env` files into `process.env`.
2. **`utils/base.ts`** imports `envInit.ts`, parses `process.env` against the Zod schema in `schema/schema.ts`, and exports a validated object.
3. Specialized config files in **`_`** import the validated object from `utils/base.ts` to create structured, type-safe exports.
4. **`index.ts`** re-exports everything for clean, single-entry imports.

## Smart Database Initialization

The system features a **Smart Initialization** engine in `db.config.ts` via the `requiredTypes` getter.

### How it works:

- It scans the domain-specific assignments (`DATABASE_TYPE_ADMIN`, `DATABASE_TYPE_USER`, etc.).
- It extracts unique database engines (e.g., if multiple domains use `mongodb`, it only lists it once).
- It returns a clean array of required connections (e.g., `['mongodb', 'postgresql']`).

### Why it matters:

- **Prevents Connection Errors**: The application won't attempt to connect to a database if no domain is assigned to it. This avoids "Connection Refused" or "Missing URI" errors for unused databases.
- **Faster Startup**: It bypasses connection timeouts for inactive database types, allowing the server to start instantly.
- **Self-Aware Drivers**: By checking `dbConfig.requiredTypes` in `app.ts`, the server dynamically decides which drivers (Mongoose or Prisma) to fire up, ignoring everything else to minimize resource overhead.
