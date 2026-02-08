# Configuration Module

This directory contains the central configuration management system for the application. It is designed for modularity, type safety, and multi-environment support.

## Core Features

- **Multi-Environment Support**: Automatically loads `.env.development`, `.env.staging`, or `.env.production` based on `NODE_ENV`.
- **Zod Validation**: Ensures all environment variables are present and correctly formatted before the server starts.
- **Separation of Concerns**: Config is split into specialized objects (DB, JWT, Server, WebSockets) to prevent code bloat.
- **Database Preference**: A central toggle to switch between MongoDB and PostgreSQL implementations.

## Directory Structure

```text
src/config/
├── env.ts            # Environment loader (dotenv logic)
├── schema.ts         # Zod schema definitions for validation
├── base.ts           # Central validation engine
├── server.config.ts  # Port and environment settings
├── db.config.ts      # MongoDB and PostgreSQL settings
├── jwt.config.ts     # Security and token settings
├── ws.config.ts      # WebSocket server settings
└── index.ts          # Main entry point (re-exports everything)
```

## Practical Usage

### 1. Selecting the Database

In your active `.env` file, set your preferred database type:

```bash
# Options: "mongodb" | "postgresql"
DATABASE_TYPE=mongodb
```

The application uses this value to determine which database to connect to in `app.ts` and which service implementation to use in the domain layers.

### 2. Accessing Configuration

Always import from the main index file. You can destructure specific configuration objects as needed:

```typescript
import { dbConfig, jwtConfig, serverConfig } from './config/index.js';

// Accessing settings
console.log(dbConfig.type); // 'mongodb'
console.log(serverConfig.port); // 5000
```

### 3. Adding New Environment Variables

To add a new configuration setting:

1. Add the variable to your `.env` files.
2. Update the `envSchema` in `src/config/schema.ts`.
3. Add the property to the appropriate specialized config file (e.g., `server.config.ts`).

## Technical Workflow

1. **`env.ts`** runs first to load the physical files into `process.env`.
2. **`base.ts`** imports `env.ts`, parses `process.env` against the Zod schema, and exports a validated object.
3. Specialized config files import the validated object from `base.ts` to create structured, type-safe exports.
4. `index.ts` re-exports everything for clean, single-entry imports.
