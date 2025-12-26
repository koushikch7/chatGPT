#!/bin/sh
set -e

# Colors (limited in sh)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "============================================="
echo "   ChatGPT App - Starting..."
echo "============================================="

# Function to check database connection
check_db_connection() {
    echo "Checking database connection..."
    
    # Extract host from DATABASE_URL
    # Format: mysql://user:pass@host:port/database
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    
    if [ -z "$DB_HOST" ]; then
        DB_HOST="mysql"
    fi
    if [ -z "$DB_PORT" ]; then
        DB_PORT="3306"
    fi
    
    echo "Database host: $DB_HOST:$DB_PORT"
    
    # Wait for database to be ready (max 60 seconds)
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "${GREEN}✓ Database is reachable${NC}"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Waiting for database... (attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done
    
    echo "${RED}✗ Could not connect to database at $DB_HOST:$DB_PORT${NC}"
    return 1
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "${RED}Error: DATABASE_URL is not set!${NC}"
    echo "Please configure DATABASE_URL in your .env.local file"
    exit 1
fi

echo "DATABASE_URL is configured"

# Check database connection
if ! check_db_connection; then
    echo ""
    echo "${RED}=============================================${NC}"
    echo "${RED}   Database Connection Failed!${NC}"
    echo "${RED}=============================================${NC}"
    echo ""
    echo "Please check:"
    echo "1. Your DATABASE_URL in .env.local is correct"
    echo "2. The MySQL server is running and accessible"
    echo "3. The database and user exist with proper permissions"
    echo ""
    echo "For Docker MySQL, ensure you started with:"
    echo "  docker compose --profile mysql up -d"
    echo ""
    echo "For external MySQL, verify your connection string:"
    echo "  mysql://user:password@host:port/database"
    echo ""
    exit 1
fi

echo ""
echo "Running database migrations..."
if ./node_modules/.bin/prisma migrate deploy; then
    echo "${GREEN}✓ Migrations completed successfully${NC}"
else
    echo "${RED}✗ Migration failed${NC}"
    echo ""
    echo "This might happen if:"
    echo "1. The database credentials are incorrect"
    echo "2. The database doesn't exist"
    echo "3. The user doesn't have proper permissions"
    echo ""
    exit 1
fi

echo ""
echo "${GREEN}=============================================${NC}"
echo "${GREEN}   Application Starting...${NC}"
echo "${GREEN}=============================================${NC}"
echo ""

exec node server.js
