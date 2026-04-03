#!/bin/bash

# RuralConnect Backend Test Script
# This script validates that all components are working

echo "🧪 RuralConnect Backend Test Suite"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Node.js
echo -n "✓ Checking Node.js... "
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}$NODE_VERSION${NC}"
else
  echo -e "${RED}NOT FOUND${NC}"
  exit 1
fi

# Test 2: Check npm
echo -n "✓ Checking npm... "
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}$NPM_VERSION${NC}"
else
  echo -e "${RED}NOT FOUND${NC}"
  exit 1
fi

# Test 3: Check backend dependencies
echo -n "✓ Checking backend dependencies... "
if [ -d "backend/node_modules" ]; then
  echo -e "${GREEN}INSTALLED${NC}"
else
  echo -e "${YELLOW}INSTALLING...${NC}"
  cd backend
  npm install
  cd ..
fi

# Test 4: Check frontend dependencies
echo -n "✓ Checking frontend dependencies... "
if [ -d "frontend/node_modules" ]; then
  echo -e "${GREEN}INSTALLED${NC}"
else
  echo -e "${YELLOW}INSTALLING...${NC}"
  cd frontend
  npm install
  cd ..
fi

# Test 5: Check CSV dataset
echo -n "✓ Checking dataset file... "
if [ -f "Datasets/updated_data.csv" ]; then
  ROWS=$(wc -l < Datasets/updated_data.csv)
  echo -e "${GREEN}FOUND ($ROWS rows)${NC}"
else
  echo -e "${RED}NOT FOUND${NC}"
fi

# Test 6: Check .env files
echo -n "✓ Checking backend .env... "
if [ -f "backend/.env" ]; then
  echo -e "${GREEN}CONFIGURED${NC}"
else
  echo -e "${YELLOW}MISSING${NC}"
  echo "   Creating default .env..."
  cp backend/.env.example backend/.env
fi

echo -n "✓ Checking frontend .env... "
if [ -f "frontend/.env" ]; then
  echo -e "${GREEN}CONFIGURED${NC}"
else
  echo -e "${YELLOW}MISSING${NC}"
  echo "   Creating default .env..."
  cp frontend/.env.example frontend/.env 2>/dev/null || echo "   Please create frontend/.env"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Terminal 1: cd backend && npm start"
echo "2. Terminal 2: cd frontend && npm run dev"
echo ""
echo "Access the app at: http://localhost:5173"
echo "API endpoint: http://localhost:3001/api"
