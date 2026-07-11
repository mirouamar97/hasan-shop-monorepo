-- HASAN SHOP PostgreSQL initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable case-insensitive text search for Arabic/French product names
ALTER DATABASE hasan_shop SET timezone TO 'Africa/Algiers';
