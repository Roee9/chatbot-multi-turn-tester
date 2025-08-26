# Chatbot Multi-turn Tester API

This API provides endpoints for testing chatbot responses using various adapters.

## Configuration

### Environment Variables

Create a `.env` file in the `api/` directory with the following variables:

```bash
# API Configuration
NODE_ENV=development
PORT=4000

# Ollama Configuration (optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_TEMPERATURE=0.2
OLLAMA_TIMEOUT=30000

# Security
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Adapter Selection

The API automatically selects the appropriate adapter based on your environment configuration:

- **If `OLLAMA_BASE_URL` and `OLLAMA_MODEL` are set**: Uses the Ollama adapter
- **If Ollama is not configured**: Falls back to the Mock adapter

## Running the API

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Testing Ollama Connection

### Health Check
Check the `/health` endpoint to verify Ollama connection status:

```bash
curl http://localhost:4000/health
```



## Troubleshooting

### Ollama Not Working

1. **Check if Ollama is running**:
   ```bash
   ollama list
   ```

2. **Verify the model is available**:
   ```bash
   ollama pull llama2
   ```

3. **Check environment variables**:
   - Ensure `OLLAMA_BASE_URL` points to your Ollama instance
   - Ensure `OLLAMA_MODEL` matches an available model

4. **Check logs**: The API logs which adapter is being used and any connection errors

5. **Test connection manually**:
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Common Issues

- **"Using Mock adapter" in logs**: Ollama environment variables are not set correctly
- **Connection timeouts**: Check if Ollama is accessible at the configured URL
- **Model not found**: Ensure the specified model is available in Ollama

## API Endpoints

- `POST /api/scan` - Start a new scan
- `GET /api/status/:id` - Get scan status
- `GET /api/results/:id` - Get scan results
- `GET /health` - Health check with Ollama status 