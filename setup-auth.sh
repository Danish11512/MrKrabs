#!/bin/bash

set -e

echo "🔧 Setting up authentication system..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect local PostgreSQL setup
LOCAL_DB_NAME="mrkrabs"
LOCAL_DB_USER="${USER:-$(whoami)}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}⚠️  .env.local not found. Creating with local database settings...${NC}"
  
  # Try to detect if PostgreSQL is installed and get default connection
  if command -v psql > /dev/null 2>&1; then
    # Try to connect to default postgres database to check if we can use peer auth
    if psql -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
      # Peer authentication works - use socket connection without credentials
      DATABASE_URL="postgresql:///${LOCAL_DB_NAME}"
      echo -e "${GREEN}✅ Detected local PostgreSQL with peer authentication${NC}"
    else
      # Fall back to localhost connection
      DATABASE_URL="postgresql://localhost:5432/${LOCAL_DB_NAME}"
      echo -e "${YELLOW}⚠️  Using localhost connection. If this fails, you may need credentials${NC}"
    fi
  else
    # PostgreSQL client not found, use default localhost format
    DATABASE_URL="postgresql://localhost:5432/${LOCAL_DB_NAME}"
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Using default localhost format${NC}"
  fi
  
  cat > .env.local << EOF
# Database (local connection - no credentials needed for peer authentication)
DATABASE_URL=${DATABASE_URL}

# Session Secret (must be at least 32 characters)
SESSION_SECRET=change-me-in-production-min-32-chars-required
EOF
  echo -e "${GREEN}✅ Created .env.local with local database settings${NC}"
else
  echo -e "${GREEN}✅ .env.local already exists${NC}"
  
  # Check if DATABASE_URL needs to be updated for local setup
  if ! grep -q "DATABASE_URL=" .env.local; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not found in .env.local. Adding local database URL...${NC}"
    if command -v psql > /dev/null 2>&1 && psql -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
      echo "DATABASE_URL=postgresql:///${LOCAL_DB_NAME}" >> .env.local
    else
      echo "DATABASE_URL=postgresql://localhost:5432/${LOCAL_DB_NAME}" >> .env.local
    fi
  fi
fi

# Check if SESSION_SECRET is set and not the template value
if grep -q "SESSION_SECRET=change-me-in-production-min-32-chars-required" .env.local; then
  echo -e "${YELLOW}⚠️  Warning: SESSION_SECRET is still using template value${NC}"
  echo "Generating a random session secret..."
  
  # Generate a random 32-character secret
  if command -v openssl > /dev/null 2>&1; then
    RANDOM_SECRET=$(openssl rand -hex 32)
  elif command -v shuf > /dev/null 2>&1; then
    RANDOM_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1 | cut -c1-64)
  else
    RANDOM_SECRET=$(date +%s | sha256sum | base64 | head -c 64)
  fi
  
  # Update .env.local with the new secret
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|SESSION_SECRET=change-me-in-production-min-32-chars-required|SESSION_SECRET=$RANDOM_SECRET|" .env.local
  else
    # Linux
    sed -i "s|SESSION_SECRET=change-me-in-production-min-32-chars-required|SESSION_SECRET=$RANDOM_SECRET|" .env.local
  fi
  
  echo -e "${GREEN}✅ Generated and set random SESSION_SECRET${NC}"
fi

# Check if database exists, create if it doesn't
echo ""
echo "🔍 Checking if database '${LOCAL_DB_NAME}' exists..."
if command -v psql > /dev/null 2>&1; then
  # Try to connect to postgres database to check/create our database
  if psql -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    # Check if database exists
    DB_EXISTS=$(psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${LOCAL_DB_NAME}'" 2>/dev/null)
    if [ -z "$DB_EXISTS" ]; then
      echo -e "${YELLOW}⚠️  Database '${LOCAL_DB_NAME}' does not exist. Creating...${NC}"
      if psql -d postgres -c "CREATE DATABASE ${LOCAL_DB_NAME};" 2>/dev/null; then
        echo -e "${GREEN}✅ Database '${LOCAL_DB_NAME}' created successfully${NC}"
      else
        echo -e "${RED}❌ Error: Could not create database${NC}"
        echo "You may need to create it manually: createdb ${LOCAL_DB_NAME}"
        echo "Or run: psql -d postgres -c \"CREATE DATABASE ${LOCAL_DB_NAME};\""
      fi
    else
      echo -e "${GREEN}✅ Database '${LOCAL_DB_NAME}' already exists${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  Cannot connect to PostgreSQL to check database${NC}"
    echo "Make sure PostgreSQL is running and accessible"
  fi
else
  echo -e "${YELLOW}⚠️  psql not found - cannot check/create database${NC}"
  echo "Make sure the database '${LOCAL_DB_NAME}' exists before running migrations"
fi

# Load environment variables (safely, handling spaces and special chars)
set -a
source .env.local
set +a

# Verify database connection
echo ""
echo "🔍 Verifying database connection..."
if command -v psql > /dev/null 2>&1; then
  # Load DATABASE_URL from .env.local
  DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  
  if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
  else
    echo -e "${YELLOW}⚠️  Warning: Cannot verify database connection${NC}"
    echo "This might be normal if using a different connection method"
    echo "Continuing anyway - migration will fail if database is not accessible..."
  fi
else
  echo -e "${YELLOW}⚠️  psql not found - skipping connection check${NC}"
  echo "Make sure PostgreSQL is running and your DATABASE_URL in .env.local is correct"
fi

# Generate migrations
echo ""
echo "📝 Generating database migrations..."
if bun run db:generate; then
  echo -e "${GREEN}✅ Migrations generated successfully${NC}"
else
  echo -e "${RED}❌ Error generating migrations${NC}"
  exit 1
fi

# Run migrations
echo ""
echo "🚀 Running database migrations..."
echo -e "${YELLOW}Note: If 'drizzle-kit migrate' fails, you may need to use 'drizzle-kit push' for development${NC}"
if bun run db:migrate; then
  echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
  echo -e "${YELLOW}⚠️  'drizzle-kit migrate' failed. Trying 'drizzle-kit push' instead...${NC}"
  if bunx drizzle-kit push; then
    echo -e "${GREEN}✅ Schema pushed successfully${NC}"
  else
    echo -e "${RED}❌ Error applying migrations${NC}"
    echo "Please check your database connection and try again"
    exit 1
  fi
fi

echo ""
echo -e "${GREEN}🎉 Authentication system setup complete!${NC}"
echo ""
echo "Local Database Setup:"
echo "  - Database name: ${LOCAL_DB_NAME}"
echo "  - Connection: Using local PostgreSQL (no credentials required)"
echo "  - If you need to create the database manually: createdb ${LOCAL_DB_NAME}"
echo ""
echo "Next steps:"
echo "1. Create a test user (you can add a registration endpoint or insert directly into the database)"
echo "2. Start the development server: bun run dev"
echo "3. Visit http://localhost:3000 to see the landing page"
echo "4. Visit http://localhost:3000/login to test the login page"
echo ""
echo "Note: This setup uses local PostgreSQL with peer authentication (no credentials needed)"
echo "      For production, update .env.local with proper database credentials"
echo ""
