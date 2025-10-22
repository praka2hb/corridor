@echo off
REM Corridor Setup Script for Windows
REM This script helps you set up the development environment

echo.
echo Setting up Corridor development environment...
echo.

REM Check if .env exists
if not exist .env (
  echo Creating .env file from .env.example...
  copy .env.example .env
  echo .env created. Please edit it and add your Grid API key.
) else (
  echo .env file already exists
)

REM Install dependencies
echo.
echo Installing dependencies...
call npm install

REM Generate Prisma client
echo.
echo Generating Prisma client...
call npm run db:generate

REM Push database schema
echo.
echo Creating database schema...
call npm run db:push

REM Seed database
echo.
echo Seeding database with initial data...
call npm run db:seed

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env and add your GRID_API_KEY
echo 2. Run 'npm run dev' to start the development server
echo 3. Visit http://localhost:3000/investments to see Kamino integration
echo.
pause

