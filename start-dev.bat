@echo off
echo Starting Chatbot Multi-turn Tester Development Environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if Ollama is available locally
where ollama >nul 2>&1
if %errorlevel% equ 0 (
    echo Local Ollama detected. Starting with local Ollama...
    
    REM Start API and Web services only
    docker-compose -f docker-compose.dev.yml up api web -d
    
    echo Services started. API will use local Ollama at http://localhost:11434
    echo Make sure Ollama is running locally with: ollama serve
    echo And pull a model with: ollama pull llama2
) else (
    echo Local Ollama not found. Starting with Docker Ollama...
    
    REM Start all services including Ollama
    docker-compose -f docker-compose.dev.yml up -d
    
    echo All services started including Docker Ollama.
    echo Waiting for Ollama to be ready...
    
    REM Wait for Ollama to be ready
    for /l %%i in (1,1,30) do (
        curl -s http://localhost:11434/api/tags >nul 2>&1
        if !errorlevel! equ 0 (
            echo Ollama is ready!
            goto :ollama_ready
        )
        echo Waiting for Ollama... (%%i/30)
        timeout /t 2 /nobreak >nul
    )
    
    :ollama_ready
    REM Pull default model
    echo Pulling llama2 model...
    docker-compose -f docker-compose.dev.yml exec ollama ollama pull llama2
)

echo.
echo Development environment is ready!
echo API: http://localhost:4000
echo Web: http://localhost:5173
echo Ollama: http://localhost:11434
echo.
echo Check API health: curl http://localhost:4000/health
echo Stop services: docker-compose -f docker-compose.dev.yml down
pause 