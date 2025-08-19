#!/bin/bash

# Ollama WebSearch Setup Script
# This script helps you set up the complete environment

set -e

echo "🔍 Setting up Ollama WebSearch..."
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to ask yes/no question
ask_yes_no() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists deno; then
    echo "❌ Deno is not installed. Please install from https://deno.land/"
    exit 1
fi
echo "✅ Deno found"

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install from https://docker.com/"
    exit 1
fi
echo "✅ Docker found"

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install docker-compose"
    exit 1
fi
echo "✅ Docker Compose found"

# Setup configuration
echo ""
echo "⚙️ Setting up configuration..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "📝 Please edit .env file to customize your settings"
else
    echo "ℹ️  .env file already exists"
fi

# Docker setup
echo ""
echo "🐳 Setting up Docker services..."

# Ask about GPU support
if ask_yes_no "Do you have an NVIDIA GPU and want to use it with Ollama?"; then
    COMPOSE_PROFILES="gpu"
    echo "🎮 Will use GPU-enabled Ollama"
else
    COMPOSE_PROFILES="cpu"
    echo "💻 Will use CPU-only Ollama"
fi

# Ask about caching
if ask_yes_no "Do you want to enable Redis caching for better performance?"; then
    COMPOSE_PROFILES="$COMPOSE_PROFILES,cache"
    echo "💾 Will enable Redis caching"
fi

# Ask about web interface
if ask_yes_no "Do you want to set up the web interface?"; then
    COMPOSE_PROFILES="$COMPOSE_PROFILES,web"
    echo "🌐 Will set up web interface"
fi

# Start services
echo ""
echo "🚀 Starting services..."
COMPOSE_PROFILES=$COMPOSE_PROFILES docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if SearXNG is running
if curl -s http://localhost:9999 > /dev/null; then
    echo "✅ SearXNG is running on http://localhost:9999"
else
    echo "❌ SearXNG failed to start"
fi

# Check if Ollama is running
if curl -s http://localhost:11434 > /dev/null; then
    echo "✅ Ollama is running on http://localhost:11434"
    
    # Install default model
    echo "📦 Installing default AI model..."
    docker exec ollama-websearch-ollama-${COMPOSE_PROFILES%,*} ollama pull llama3.2:1b
    echo "✅ Model llama3.2:1b installed"
else
    echo "❌ Ollama failed to start"
fi

# Make search script executable
chmod +x search.sh
echo "✅ Made search.sh executable"

# Test the setup
echo ""
echo "🧪 Testing the setup..."
if ./search.sh "test query" > /dev/null 2>&1; then
    echo "✅ Basic functionality test passed"
else
    echo "⚠️  Basic test failed, but this might be normal if models are still loading"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Quick start:"
echo "  ./search.sh \"your search query here\""
echo ""
echo "🔧 Available commands:"
echo "  docker-compose logs          # View logs"
echo "  docker-compose down          # Stop services"
echo "  docker-compose pull          # Update images"
echo ""
echo "🌐 Web interfaces:"
echo "  SearXNG: http://localhost:9999"
echo "  Ollama: http://localhost:11434"
if [[ $COMPOSE_PROFILES == *"web"* ]]; then
    echo "  Web UI: http://localhost:3000"
fi
echo ""
echo "📖 Documentation: README.md"
echo "🐛 Issues: https://github.com/yourusername/ollama_websearch/issues"
