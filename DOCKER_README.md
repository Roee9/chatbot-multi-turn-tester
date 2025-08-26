# Docker Setup for Chatbot Multi-turn Tester

This project includes Docker configurations for easy development and deployment.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Copy environment variables:**
   ```bash
   cp env.example .env
   ```

2. **Start all services:**
   ```bash
   docker compose up
   ```

3. **Start with Ollama (optional):**
   ```bash
   docker compose --profile ollama up
   ```

## Services

### API Service (Port 4000)
- Node.js API server
- Hot reload enabled in development
- Health check endpoint at `/health`

### Web Service (Port 5173)
- React frontend with Vite
- Hot reload enabled in development
- Accessible at `http://localhost:5173`

### Ollama Service (Port 11434, Optional)
- Local LLM server
- Only started when using `--profile ollama`
- Models are persisted in Docker volume

## Development

### Hot Reload
Both API and web services have hot reload enabled through volume mounts:
- Source code changes are immediately reflected
- Node modules are preserved in containers

### Environment Variables
Edit `.env` file to customize:
- API port and configuration
- Ollama settings
- Security settings
- Logging levels

### Building Images
```bash
# Build all services
docker compose build

# Build specific service
docker compose build api
docker compose build web
```

### Running Commands
```bash
# Run tests in API container
docker compose exec api npm test

# Install new dependencies in web container
docker compose exec web npm install package-name
```

## Production

For production deployment, modify the Dockerfiles to:
1. Use multi-stage builds
2. Remove development dependencies
3. Use production environment variables
4. Optimize image sizes

## Troubleshooting

### Port Conflicts
If ports 4000, 5173, or 11434 are already in use:
1. Stop conflicting services
2. Or modify ports in `docker-compose.yml`

### Ollama Issues
- Ensure you have enough disk space for models
- Check Ollama logs: `docker compose logs ollama`
- Pull models manually: `docker compose exec ollama ollama pull llama2`

### Volume Issues
If hot reload isn't working:
1. Check file permissions
2. Restart containers: `docker compose restart`
3. Rebuild images: `docker compose build --no-cache`

## Cleanup

```bash
# Stop all services
docker compose down

# Remove volumes (will delete Ollama models)
docker compose down -v

# Remove images
docker compose down --rmi all
``` 