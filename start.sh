#!/bin/bash

# Quick Start Script for AI Compliance Document Analyzer
# This script helps you quickly set up and test the application

set -e

echo "🚀 AI Compliance Document Analyzer - Quick Start"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

BACKEND_ENV_FILE="backend/.env"
BACKEND_ENV_EXAMPLE_FILE="backend/.env.example"

get_env_value() {
    # Usage: get_env_value KEY FILE
    # Prints the value for KEY=... in FILE, or empty string if missing.
    local key="$1"
    local file="$2"
    grep -E "^${key}=" "$file" 2>/dev/null | head -n 1 | sed -E 's/^[^=]*=//'
}

# Check if backend/.env exists
echo "Step 1: Checking backend environment configuration..."
if [ ! -f "$BACKEND_ENV_FILE" ]; then
    print_error "$BACKEND_ENV_FILE not found!"

    if [ -f "$BACKEND_ENV_EXAMPLE_FILE" ]; then
        print_info "Creating $BACKEND_ENV_FILE from $BACKEND_ENV_EXAMPLE_FILE..."
        cp "$BACKEND_ENV_EXAMPLE_FILE" "$BACKEND_ENV_FILE"
    else
        print_info "Creating $BACKEND_ENV_FILE template..."
        cat > "$BACKEND_ENV_FILE" << 'EOF'
PORT=8000
ANTHROPIC_API_KEY=sk-ant-xxxx
PINECONE_API_KEY=xxxx
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=index-name
EOF
    fi

    print_warning "Please edit $BACKEND_ENV_FILE with your actual API keys"
    print_info "Get Anthropic key: https://console.anthropic.com/"
    print_info "Get Pinecone key: https://www.pinecone.io/"
    echo ""
    echo "After setting up $BACKEND_ENV_FILE, run this script again."
    exit 1
else
    print_success "$BACKEND_ENV_FILE found"
fi

# Check if API keys are set in backend/.env
ANTHROPIC_API_KEY_VALUE="$(get_env_value ANTHROPIC_API_KEY "$BACKEND_ENV_FILE")"
PINECONE_API_KEY_VALUE="$(get_env_value PINECONE_API_KEY "$BACKEND_ENV_FILE")"

if [ -z "$ANTHROPIC_API_KEY_VALUE" ] || [ "$ANTHROPIC_API_KEY_VALUE" = "your_anthropic_api_key_here" ] || [ "$ANTHROPIC_API_KEY_VALUE" = "sk-ant-xxxx" ]; then
    print_error "ANTHROPIC_API_KEY not configured in $BACKEND_ENV_FILE"
    exit 1
fi

if [ -z "$PINECONE_API_KEY_VALUE" ] || [ "$PINECONE_API_KEY_VALUE" = "your_pinecone_api_key_here" ] || [ "$PINECONE_API_KEY_VALUE" = "xxxx" ]; then
    print_error "PINECONE_API_KEY not configured in $BACKEND_ENV_FILE"
    exit 1
fi

print_success "API keys configured"
echo ""

# Check if node_modules exists
echo "Step 2: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies found"
fi

if [ ! -d "client/node_modules" ]; then
    print_info "Installing frontend dependencies..."
    cd client
    npm install
    cd ..
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies found"
fi
echo ""

# Check if client/.env exists
echo "Step 3: Configuring frontend..."
if [ ! -f "client/.env" ]; then
    print_info "Creating client/.env..."
    cat > client/.env << 'EOF'
VITE_API_URL=http://localhost:8000/api
EOF
    print_success "Frontend configured"
else
    print_success "Frontend already configured"
fi
echo ""

# Display test credentials
echo "Step 4: Test Credentials"
echo "========================"
print_info "Use these credentials to login:"
echo "   Username: admin     Password: admin123"
echo "   Username: analyst   Password: analyst123"
echo "   Username: demo      Password: demo123"
echo ""

# Display URLs
echo "Step 5: Application URLs"
echo "========================"
print_info "Frontend: http://localhost:5173"
print_info "Backend:  http://localhost:8000"
print_info "API Docs: See backend/API.md"
echo ""

# Ask user how to proceed
echo "How would you like to start?"
echo "1) Start backend only"
echo "2) Start frontend only"
echo "3) Start both (recommended)"
echo "4) Run API tests"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        print_info "Starting backend server..."
        npm run dev:backend
        ;;
    2)
        print_info "Starting frontend..."
        cd client && npm run dev
        ;;
    3)
        print_info "Starting both backend and frontend..."
        print_warning "This will start two processes. Press Ctrl+C to stop."
        npm run dev
        ;;
    4)
        print_info "Running API tests..."
        echo ""
        echo "Test 1: Health Check"
                curl -s http://localhost:8000/api/documents || print_error "Backend not running!"
        echo ""
        
        echo "Test 2: Login"
                curl -X POST http://localhost:8000/api/auth/login \
          -H "Content-Type: application/json" \
          -d '{"username":"admin","password":"admin123"}' | jq '.'
        echo ""
        
        print_success "API tests completed"
        ;;
    5)
        print_info "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac
