#!/bin/bash

# ===========================================
# ChatGPT App - One-Command Launcher
# ===========================================
# Usage: ./run.sh [command]
#   ./run.sh          - Start the app (runs setup if needed)
#   ./run.sh stop     - Stop all containers
#   ./run.sh restart  - Restart all containers
#   ./run.sh logs     - View logs
#   ./run.sh build    - Rebuild and start
#   ./run.sh clean    - Stop and remove volumes
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to print header
print_header() {
    echo -e "${BLUE}"
    echo "============================================="
    echo "   ChatGPT Multi-AI App"
    echo "============================================="
    echo -e "${NC}"
}

# Function to check if .env.local exists and is configured
check_env_configured() {
    if [ ! -f .env.local ]; then
        return 1
    fi
    
    # Check if AUTH_SECRET is set (not the placeholder)
    if grep -q "AUTH_SECRET=your-secret-here" .env.local 2>/dev/null; then
        return 1
    fi
    
    # Check if DATABASE_URL is set
    if ! grep -q "DATABASE_URL=" .env.local 2>/dev/null; then
        return 1
    fi
    
    return 0
}

# Function to get MySQL mode from config
get_mysql_mode() {
    if grep -q "USE_DOCKER_MYSQL=false" .env.local 2>/dev/null; then
        echo "external"
    else
        echo "mysql"
    fi
}

# Function to run initial setup
run_setup() {
    print_header
    
    echo -e "${YELLOW}First-time setup required.${NC}"
    echo ""
    
    # Check if .env.local exists
    if [ ! -f .env.local ]; then
        echo -e "${CYAN}Creating .env.local from template...${NC}"
        if [ -f .env.local.example ]; then
            cp .env.local.example .env.local
        else
            echo -e "${RED}Error: .env.local.example not found!${NC}"
            exit 1
        fi
    fi
    
    echo ""
    echo -e "${YELLOW}Choose your MySQL setup:${NC}"
    echo ""
    echo "  1) Docker MySQL (recommended for local development)"
    echo "     - MySQL runs in a Docker container"
    echo "     - Data persists in Docker volume"
    echo ""
    echo "  2) External MySQL (for production or existing database)"
    echo "     - Use your own MySQL server"
    echo "     - You provide the connection details"
    echo ""
    
    read -p "Enter choice [1/2]: " mysql_choice
    echo ""
    
    case $mysql_choice in
        1)
            echo -e "${GREEN}✓ Using Docker MySQL container${NC}"
            
            # Set USE_DOCKER_MYSQL=true
            if grep -q "USE_DOCKER_MYSQL" .env.local; then
                sed -i 's/USE_DOCKER_MYSQL=.*/USE_DOCKER_MYSQL=true/' .env.local
            else
                echo "" >> .env.local
                echo "# MySQL Mode (true=Docker container, false=external)" >> .env.local
                echo "USE_DOCKER_MYSQL=true" >> .env.local
            fi
            
            # Ensure DATABASE_URL points to docker mysql
            sed -i 's|DATABASE_URL=.*|DATABASE_URL=mysql://chatgpt:chatgptpassword@mysql:3306/chatgpt|' .env.local
            ;;
            
        2)
            echo -e "${CYAN}Configuring External MySQL...${NC}"
            echo ""
            
            # Set USE_DOCKER_MYSQL=false
            if grep -q "USE_DOCKER_MYSQL" .env.local; then
                sed -i 's/USE_DOCKER_MYSQL=.*/USE_DOCKER_MYSQL=false/' .env.local
            else
                echo "" >> .env.local
                echo "# MySQL Mode (true=Docker container, false=external)" >> .env.local
                echo "USE_DOCKER_MYSQL=false" >> .env.local
            fi
            
            read -p "MySQL Host [localhost]: " db_host
            db_host=${db_host:-localhost}
            
            # Convert localhost/127.0.0.1 to host.docker.internal for Docker
            original_host="$db_host"
            if [ "$db_host" == "localhost" ] || [ "$db_host" == "127.0.0.1" ]; then
                echo ""
                echo -e "${YELLOW}Note: 'localhost' inside Docker refers to the container itself.${NC}"
                echo -e "${YELLOW}Converting to 'host.docker.internal' to reach your host machine.${NC}"
                db_host="host.docker.internal"
            fi
            
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
            
            # Test connection from host first (using original host)
            echo ""
            echo -e "${CYAN}Testing database connection...${NC}"
            if command -v mysql &> /dev/null; then
                if mysql -h "$original_host" -P "$db_port" -u "$db_user" -p"$db_pass" -e "SELECT 1" "$db_name" &> /dev/null; then
                    echo -e "${GREEN}✓ Database connection successful!${NC}"
                else
                    echo -e "${YELLOW}⚠ Could not verify connection. Make sure:${NC}"
                    echo "  - MySQL is running on ${original_host}:${db_port}"
                    echo "  - Database '${db_name}' exists"
                    echo "  - User '${db_user}' has access"
                    echo ""
                    read -p "Continue anyway? [y/N]: " continue_anyway
                    if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
                        exit 1
                    fi
                fi
            else
                echo -e "${YELLOW}MySQL client not installed. Skipping connection test.${NC}"
            fi
            
            # Construct and save DATABASE_URL (with docker-compatible host)
            DATABASE_URL="mysql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}"
            sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env.local
            
            echo ""
            echo -e "${GREEN}✓ Database configured: ${db_host}:${db_port}/${db_name}${NC}"
            if [ "$db_host" == "host.docker.internal" ]; then
                echo -e "${CYAN}  (Docker will connect to your host machine's MySQL)${NC}"
            fi
            ;;
            
        *)
            echo -e "${RED}Invalid choice. Exiting.${NC}"
            exit 1
            ;;
    esac
    
    # Generate AUTH_SECRET if not set
    if grep -q "AUTH_SECRET=your-secret-here" .env.local 2>/dev/null || \
       grep -q "AUTH_SECRET=$" .env.local 2>/dev/null; then
        echo ""
        echo -e "${CYAN}Generating AUTH_SECRET...${NC}"
        NEW_SECRET=$(openssl rand -base64 32)
        sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=${NEW_SECRET}|" .env.local
        echo -e "${GREEN}✓ AUTH_SECRET generated${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${GREEN}   Setup Complete!${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo -e "${YELLOW}Important: Configure OAuth before first login${NC}"
    echo "See SSO_SETUP.md for Google/GitHub OAuth setup"
    echo ""
    
    read -p "Press Enter to start the application..."
}

# Function to start containers
start_containers() {
    local mode=$(get_mysql_mode)
    local build_flag=""
    
    if [ "$1" == "--build" ]; then
        build_flag="--build"
    fi
    
    echo -e "${CYAN}Starting containers (mode: $mode)...${NC}"
    echo ""
    
    if [ "$mode" == "mysql" ]; then
        docker compose --profile mysql up -d $build_flag
    else
        docker compose --profile external up -d $build_flag
    fi
    
    echo ""
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${GREEN}   Application Started!${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo -e "Access the app at: ${CYAN}http://localhost:3000${NC}"
    echo ""
    echo -e "View logs: ${YELLOW}./run.sh logs${NC}"
    echo -e "Stop:      ${YELLOW}./run.sh stop${NC}"
    echo ""
}

# Function to stop containers
stop_containers() {
    echo -e "${CYAN}Stopping containers...${NC}"
    docker compose --profile mysql --profile external down
    echo -e "${GREEN}✓ Containers stopped${NC}"
}

# Function to show logs
show_logs() {
    docker compose --profile mysql --profile external logs -f
}

# Function to clean up
clean_up() {
    echo -e "${RED}WARNING: This will delete all data including the database!${NC}"
    read -p "Are you sure? [y/N]: " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        docker compose --profile mysql --profile external down -v
        echo -e "${GREEN}✓ Containers and volumes removed${NC}"
    else
        echo "Cancelled."
    fi
}

# Function to show status
show_status() {
    echo -e "${CYAN}Container Status:${NC}"
    docker compose --profile mysql --profile external ps
}

# Main command handling
case "${1:-start}" in
    start|up)
        print_header
        
        # Check if setup is needed
        if ! check_env_configured; then
            run_setup
        else
            echo -e "${GREEN}✓ Configuration found${NC}"
            echo ""
        fi
        
        start_containers
        ;;
        
    stop|down)
        print_header
        stop_containers
        ;;
        
    restart)
        print_header
        stop_containers
        echo ""
        start_containers
        ;;
        
    logs)
        show_logs
        ;;
        
    build)
        print_header
        
        if ! check_env_configured; then
            run_setup
        fi
        
        start_containers --build
        ;;
        
    status|ps)
        print_header
        show_status
        ;;
        
    clean|purge)
        print_header
        clean_up
        ;;
        
    setup|config)
        run_setup
        ;;
        
    help|--help|-h)
        print_header
        echo "Usage: ./run.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start    Start the application (default)"
        echo "  stop     Stop all containers"
        echo "  restart  Restart all containers"
        echo "  logs     View container logs"
        echo "  build    Rebuild and start containers"
        echo "  status   Show container status"
        echo "  setup    Run setup wizard again"
        echo "  clean    Stop and remove all data (WARNING!)"
        echo "  help     Show this help message"
        echo ""
        ;;
        
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Run './run.sh help' for usage information"
        exit 1
        ;;
esac
