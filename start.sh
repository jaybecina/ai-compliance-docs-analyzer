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

# Check if .env file exists
echo "Step 1: Checking environment configuration..."
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Creating .env template..."
    
    cat > .env << 'EOF'
PORT=8000
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=your_pinecone_index_name
EOF
    
    print_warning "Please edit .env file with your actual API keys"
    print_info "Get Anthropic key: https://console.anthropic.com/"
    print_info "Get Pinecone key: https://www.pinecone.io/"
    echo ""
    echo "After setting up .env, run this script again."
    exit 1
else
    print_success ".env file found"
fi

# Check if API keys are set
if grep -q "your_anthropic_api_key_here" .env; then
    print_error "ANTHROPIC_API_KEY not configured in .env"
    exit 1
fi

if grep -q "your_pinecone_api_key_here" .env; then
    print_error "PINECONE_API_KEY not configured in .env"
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
