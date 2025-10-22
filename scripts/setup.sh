#!/bin/bash

# Corridor Setup Script
# This script helps you set up the development environment

echo "🚀 Setting up Corridor development environment..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "✅ .env created. Please edit it and add your Grid API key."
else
  echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push database schema
echo "🗄️  Creating database schema..."
npm run db:push

# Seed database
echo "🌱 Seeding database with initial data..."
npm run db:seed

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your GRID_API_KEY"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000/investments to see Kamino integration"
echo ""

