#!/bin/bash

# School ERP Production Setup Script

echo "🎓 School ERP - Production Setup"
echo "================================"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is accessible
echo ""
echo "Checking MongoDB connection..."
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  MONGODB_URI not set. Please configure backend/.env"
else
    echo "✅ MONGODB_URI configured"
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed"
    exit 1
fi
echo "✅ Backend dependencies installed"

# Build backend
echo ""
echo "🔨 Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
echo "✅ Backend built successfully"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed"
    exit 1
fi
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Configure backend/.env with your settings"
echo "   2. Run 'npm run seed' in backend/ to create demo data"
echo "   3. Production deployment:"
echo "      - Docker: docker-compose up -d"
echo "      - PM2: cd backend && pm2 start ecosystem.config.js --env production"
echo ""
echo "📚 Documentation:"
echo "   - Production guide: backend/PRODUCTION.md"
echo "   - Summary: PRODUCTION_SUMMARY.md"
echo "   - Main README: README.md"
echo ""
echo "🚀 Ready to deploy!"
