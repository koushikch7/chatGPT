#!/bin/bash

# ===========================================
# ChatGPT App - Interactive Setup Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================="
echo "   ChatGPT Multi-AI App - Setup Wizard"
echo "============================================="
echo -e "${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}No .env.local file found. Creating from template...${NC}"
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}Created .env.local from template.${NC}"
    else
        echo -e "${RED}Error: .env.local.example not found!${NC}"
        exit 1
    fi
fi

# Source current env
source .env.local 2>/dev/null || true

echo ""
echo -e "${YELLOW}Do you want to use Docker MySQL container or external MySQL?${NC}"
echo "1) Docker MySQL (recommended for local development)"
echo "2) External MySQL (for production or existing database)"
echo ""
read -p "Enter choice [1/2]: " mysql_choice

case $mysql_choice in
    1)
        echo ""
        echo -e "${GREEN}Using Docker MySQL container.${NC}"
        
        # Set USE_DOCKER_MYSQL=true in .env.local
        if grep -q "USE_DOCKER_MYSQL" .env.local; then
            sed -i 's/USE_DOCKER_MYSQL=.*/USE_DOCKER_MYSQL=true/' .env.local
        else
            echo "" >> .env.local
            echo "# MySQL Mode" >> .env.local
            echo "USE_DOCKER_MYSQL=true" >> .env.local
        fi
        
        # Update DATABASE_URL for docker
        sed -i 's|DATABASE_URL=.*|DATABASE_URL=mysql://chatgpt:chatgptpassword@mysql:3306/chatgpt|' .env.local
        
        echo -e "${GREEN}Configuration updated for Docker MySQL.${NC}"
        echo ""
        echo -e "${BLUE}To start the application:${NC}"
        echo "  docker compose --profile mysql up -d"
        echo ""
        echo -e "${BLUE}Or start everything:${NC}"
        echo "  docker compose --profile mysql --profile app up -d"
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}Using External MySQL database.${NC}"
        
        # Set USE_DOCKER_MYSQL=false
        if grep -q "USE_DOCKER_MYSQL" .env.local; then
            sed -i 's/USE_DOCKER_MYSQL=.*/USE_DOCKER_MYSQL=false/' .env.local
        else
            echo "" >> .env.local
            echo "# MySQL Mode" >> .env.local
            echo "USE_DOCKER_MYSQL=false" >> .env.local
        fi
        
        echo ""
        echo -e "${YELLOW}Please enter your external MySQL connection details:${NC}"
        
        read -p "MySQL Host [localhost]: " db_host
        db_host=${db_host:-localhost}
        
        read -p "MySQL Port [3306]: " db_port
        db_port=${db_port:-3306}
        
        read -p "MySQL Database [chatgpt]: " db_name
        db_name=${db_name:-chatgpt}
        
        read -p "MySQL User [chatgpt]: " db_user
        db_user=${db_user:-chatgpt}
        
        read -sp "MySQL Password: " db_pass
        echo ""
        
        if [ -z "$db_pass" ]; then
            echo -e "${RED}Error: Password cannot be empty!${NC}"
            exit 1
        fi
        
        # Construct DATABASE_URL
        DATABASE_URL="mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}"
        
        # Update .env.local
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env.local
        
        echo ""
        echo -e "${YELLOW}Testing database connection...${NC}"
        
        # Test connection using node/mysql or docker
        if command -v mysql &> /dev/null; then
            if mysql -h "$db_host" -P "$db_port" -u "$db_user" -p"$db_pass" -e "SELECT 1" "$db_name" &> /dev/null; then
                echo -e "${GREEN}✓ Database connection successful!${NC}"
            else
                echo -e "${RED}✗ Database connection failed!${NC}"
                echo -e "${YELLOW}Please verify your credentials and ensure the database exists.${NC}"
                echo ""
                echo "To create the database manually:"
                echo "  mysql -u root -p -e \"CREATE DATABASE ${db_name};\""
                echo "  mysql -u root -p -e \"CREATE USER '${db_user}'@'%' IDENTIFIED BY 'your_password';\""
                echo "  mysql -u root -p -e \"GRANT ALL PRIVILEGES ON ${db_name}.* TO '${db_user}'@'%';\""
                echo ""
                read -p "Continue anyway? [y/N]: " continue_anyway
                if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
                    echo -e "${RED}Setup aborted. Please update .env.local with correct credentials.${NC}"
                    exit 1
                fi
            fi
        else
            echo -e "${YELLOW}MySQL client not found. Skipping connection test.${NC}"
            echo "Connection will be tested when the app starts."
        fi
        
        echo ""
        echo -e "${GREEN}Configuration updated for External MySQL.${NC}"
        echo ""
        echo -e "${BLUE}To start the application (without MySQL container):${NC}"
        echo "  docker compose --profile app up -d"
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "1. Update OAuth callback URLs for your domain"
echo "2. Generate a new AUTH_SECRET for production:"
echo "   openssl rand -base64 32"
echo ""
