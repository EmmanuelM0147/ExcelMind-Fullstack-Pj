-- Initialize database with basic setup
-- This script runs automatically when PostgreSQL container starts

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS fullstack_app;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create basic indexes for performance
-- These will be created by TypeORM migrations, but having them here as backup

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$;