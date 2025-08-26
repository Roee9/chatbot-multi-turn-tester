#!/bin/bash

echo "Starting Chatbot Multi-turn Tester Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Ollama is available locally
if command -v ollama &> /dev/null; then
    echo "Local Ollama detected. Starting with local Ollama..."
    
    # Start API and Web services only
    docker-compose -f docker-compose.dev.yml up api web -d
    
    echo "Services started. API will use local Ollama at http://localhost:11434"
    echo "Make sure Ollama is running locally with: ollama serve"
    echo "And pull a model with: ollama pull llama2"
else
    echo "Local Ollama not found. Starting with Docker Ollama..."
    
    # Start all services including Ollama
    docker-compose -f docker-compose.dev.yml up -d
    
    echo "All services started including Docker Ollama."
    echo "Waiting for Ollama to be ready..."
    
    # Wait for Ollama to be ready
    for i in {1..30}; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo "Ollama is ready!"
            break
        fi
        echo "Waiting for Ollama... ($i/30)"
        sleep 2
    done
    
    # Pull default model
    echo "Pulling llama2 model..."
    docker-compose -f docker-compose.dev.yml exec ollama ollama pull llama2
fi

echo ""
echo "Development environment is ready!"
echo "API: http://localhost:4000"
echo "Web: http://localhost:5173"
echo "Ollama: http://localhost:11434"
echo ""
echo "Check API health: curl http://localhost:4000/health"
echo "Stop services: docker-compose -f docker-compose.dev.yml down" 