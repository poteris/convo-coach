#!/bin/bash
# Start all services for LiveKit voice development

echo "🚀 Starting Convo Coach with LiveKit Voice Agent..."
echo ""

# Check if Python virtual environment exists
if [ ! -d "backend/livekit-agent/venv" ]; then
    echo "❌ Python virtual environment not found!"
    echo "Please run: cd backend/livekit-agent && ./setup.sh"
    exit 1
fi

# Check if .env exists in livekit-agent directory
if [ ! -f "backend/livekit-agent/.env" ]; then
    echo "⚠️  Warning: backend/livekit-agent/.env not found"
    echo "Copying from root .env..."
    if [ -f ".env" ]; then
        cp .env backend/livekit-agent/.env
        echo "✅ .env copied"
    else
        echo "❌ Root .env not found! Please create it with your API keys."
        exit 1
    fi
fi

echo "Starting services in separate terminal tabs/windows..."
echo ""
echo "📝 To monitor logs:"
echo "  - Terminal 1: Next.js frontend (pnpm dev)"
echo "  - Terminal 2: LiveKit agent (python agent.py dev)"
echo ""

# Check OS for terminal commands
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use Terminal
    echo "Opening terminals on macOS..."
    
    # Terminal 1: Frontend
    osascript -e 'tell application "Terminal" to do script "cd \"'"$(pwd)"'/frontend\" && pnpm dev"'
    
    # Terminal 2: LiveKit Agent
    osascript -e 'tell application "Terminal" to do script "cd \"'"$(pwd)"'/backend/livekit-agent\" && source venv/bin/activate && python agent.py dev"'
    
    echo ""
    echo "✅ Services started in new Terminal windows!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🤖 LiveKit Agent: Check the second terminal window"
    
else
    # Linux or other - print manual commands
    echo "Please run these commands in separate terminals:"
    echo ""
    echo "Terminal 1 (Frontend):"
    echo "  cd frontend && pnpm dev"
    echo ""
    echo "Terminal 2 (LiveKit Agent):"
    echo "  cd backend/livekit-agent && source venv/bin/activate && python agent.py dev"
    echo ""
fi

echo ""
echo "📖 See LIVEKIT_MIGRATION_GUIDE.md for troubleshooting"

