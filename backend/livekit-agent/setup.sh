#!/bin/bash
# Setup Python virtual environment for LiveKit agent

cd "$(dirname "$0")"

echo "🔧 Setting up LiveKit agent environment..."

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate it
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ LiveKit agent environment ready!"
echo ""
echo "To activate: source backend/livekit-agent/venv/bin/activate"
echo "To run agent: python backend/livekit-agent/agent.py dev"
echo ""
echo "⚠️ Remember to copy .env.example to .env and add your API keys!"

