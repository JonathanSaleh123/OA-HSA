#!/bin/bash

echo "🚀 Starting HSA Application Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use. Please stop the service using port $1 first."
        return 1
    fi
    return 0
}

# Check if ports are available
echo "🔍 Checking if ports are available..."
if ! check_port 3001; then
    exit 1
fi
if ! check_port 3000; then
    exit 1
fi
echo "✅ Ports 3000 and 3001 are available"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install backend dependencies"
        exit 1
    fi
else
    echo "✅ Backend dependencies already installed"
fi

# Initialize database
echo "🗄️  Initializing database..."
npm run db:init
if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

# Start backend server in background
echo "🔧 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo "✅ Backend server is running on http://localhost:3001"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi

# Start frontend server in background
echo "🎨 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend failed to start"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi
echo "✅ Frontend server is running on http://localhost:3000"

echo ""
echo "🎉 HSA Application is now running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "📊 Health:   http://localhost:3001/health"
echo ""
echo "💡 You can now:"
echo "   - Open http://localhost:3000 in your browser"
echo "   - Create an account or sign in"
echo "   - Test the HSA functionality"
echo ""
echo "🛑 To stop the servers, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait
