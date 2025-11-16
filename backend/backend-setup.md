# Backend setup and run instructions

This document explains how to start the Rust backend for this project and how to set up PostgreSQL (Linux/WSL or Windows). It includes tips for common issues (sqlx compile-time checks, extensions, permissions) and sample SQL for initializing the database.

## Prerequisites

- Rust toolchain (stable) with `cargo` installed. See https://rustup.rs/
- PostgreSQL (local or remote)
- `psql` client (usually installed with PostgreSQL)
- (Optional) `docker` / `docker-compose` if you prefer containers.

The backend listens on port `7564` by default.

## 1. Configure DATABASE_URL

Create a file named `.env` in the `backend/` folder (this project uses `dotenv` in Rust so the file will be read automatically). Example contents:

```env
DATABASE_URL=postgres://<dbuser>:<dbpass>@<host>:<port>/<dbname>
```

Example for local Postgres (recommended during development):

```env
DATABASE_URL=postgres://postgres:123456@localhost:5432/mindful_city
```

Replace credentials/host/port/dbname to match your environment.

## 2. Initialize the database schema

This repository contains SQL initialization under `backend/db/init.sql`. You can run it with `psql`.

On Linux / WSL (run as a user that can connect to Postgres or use `sudo -u postgres`):

```bash
# create the DB (if you haven't already)
sudo -u postgres psql -c "CREATE DATABASE mindful_city;"

# create role (if needed)
sudo -u postgres psql -c 'DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '\''potgres'\'') THEN CREATE ROLE potgres WITH LOGIN PASSWORD '\''123456'\''; END IF; END $$;'

# grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mindful_city TO potgres;"

# run the init.sql file (connect as the DB owner or a superuser)
psql -d mindful_city -U postgres -f backend/db/init.sql
```

If you prefer, you can open `psql` and paste the SQL from `backend/db/init.sql`.

Important: the project expects `uuid-ossp` extension and a `quest_state` enum. `init.sql` should create these but double-check if you modified or re-created the DB manually.

## 3. SQLx compile-time checks

This project uses `sqlx` macros (e.g. `query!`, `query_as!`) which validate queries at compile time against the database defined in `DATABASE_URL`.

- Ensure `DATABASE_URL` is set and the database is reachable before running `cargo build` / `cargo run`.
- If you cannot have the DB available at compile time, you can use `SQLX_OFFLINE=1` and provide a pre-generated `sqlx-data.json` (not covered here). For local dev it's easiest to start Postgres locally.

## 4. Start the backend

From the repository root (or `backend/`):

```bash
cd backend
cargo run
```

You should see the binary build and then the server start. The server prints a sample user at startup (the code does a quick query to ensure DB connectivity). If it exits with permission errors, check DB ownership and grants.

### Common runtime issues & fixes

- `permission denied for table users` — change table ownership and grant privileges to the user referenced in `DATABASE_URL` (example below).
- `sqlx` validation errors — ensure your DB schema matches the Rust types (columns not-null vs Option<>). If you changed schema, re-run `init.sql` and/or update Rust types.

To change ownership/grants (run as postgres superuser):

```sql
ALTER TABLE users OWNER TO <dbuser>;
ALTER TABLE quests OWNER TO <dbuser>;
ALTER TABLE user_quest OWNER TO <dbuser>;
ALTER TYPE quest_state OWNER TO <dbuser>;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO <dbuser>;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO <dbuser>;
```

## 5. CORS (if using the frontend dev server)

If you run the frontend on Vite (`npm run dev`), your browser will request the backend from a different origin. If you see CORS errors in the browser console, add a CORS layer to the backend.

Example (the project already had this added in a recent edit): using `tower-http`'s `CorsLayer` and allowing your Vite host (e.g. `http://localhost:5173`).

## 6. Quick smoke tests (curl)

Replace `<USER_ID>` or `<QUEST_ID>` with actual values from your DB.

```bash
# Get a challenge for a user
curl -v -H "user_id: <USER_ID>" http://localhost:7564/challange/receive

# Register
curl -v -X POST -H "Content-Type: application/json" -d '{"name":"alice","email":"alice@example.com","password":"pass"}' http://localhost:7564/api/register

# Login
curl -v -X POST -H "Content-Type: application/json" -d '{"name":"alice","email":"alice@example.com","password":"pass"}' http://localhost:7564/api/login
```

## 7. How to setup PostgreSQL on Windows

Option A — Install PostgreSQL using the official installer:

1. Download the Windows installer from https://www.postgresql.org/download/windows/ (or use the EnterpriseDB installer).
2. Run the installer and follow prompts. Note the superuser name (usually `postgres`) and password you set.
3. After installation, open `pgAdmin` (graphical) or use the `psql` CLI shipped with PostgreSQL.
4. Create the database and user (use `pgAdmin` or open a Command Prompt / PowerShell and run):

```powershell
# open PowerShell as Admin or a user with permissions
# adjust path if psql isn't on PATH; replace PASSWORD and DBNAME as needed
& "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe" -U postgres -c "CREATE DATABASE mindful_city;"
& "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe" -U postgres -c "CREATE USER potgres WITH PASSWORD '123456';"
& "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE mindful_city TO potgres;"

# Run the init SQL (adjust path to psql and init.sql)
& "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe" -U postgres -d mindful_city -f "C:\\path\\to\\repo\\backend\\db\\init.sql"
```

If psql is on your PATH, you can run the same commands without full path:

```powershell
# from PowerShell
psql -U postgres -c "CREATE DATABASE mindful_city;"
psql -U postgres -c "CREATE USER potgres WITH PASSWORD '123456';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE mindful_city TO potgres;"
psql -U postgres -d mindful_city -f "C:\\path\\to\\repo\\backend\\db\\init.sql"
```

Option B — Use Docker on Windows (recommended if you don't want to install Postgres natively)

Create a `docker-compose.yml` (example):

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: mindful_city
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Then from the repo root:

```bash
docker compose up -d
# wait for DB to be ready, then run init.sql (use psql or pgAdmin)
```

## 8. Environment variables on Windows

- PowerShell (session): `$env:DATABASE_URL = 'postgres://postgres:123456@localhost:5432/mindful_city'`
- CMD: `set DATABASE_URL=postgres://postgres:123456@localhost:5432/mindful_city`
- Persistent (system/user): use System Properties -> Environment Variables or `setx`.

## 9. Final notes and troubleshooting

- If `cargo run` fails with `permission denied` or `cannot find extension uuid-ossp`, make sure the DB user has privileges and `uuid-ossp` extension is installed in the target DB.
- If SQLx reports mismatched column types vs your Rust structs, either adjust the Rust types to `Option<T>` where DB allows NULL, or alter your DB to match the non-null expectations.
- If frontend requests fail from the browser, check the browser console for CORS errors and add a CORS layer to the backend (allowed origins: your Vite dev URL).

If you want, I can also add a small `docker-compose` that brings up Postgres and the backend together, or add a `/api/me` endpoint so the frontend can fetch the full user object after login.
