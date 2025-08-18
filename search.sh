#!/bin/bash

# Simple search script using SearXNG and AI
export PATH="/home/icyberhack/.deno/bin:$PATH"
export SEARCH_URL="http://localhost:9999/search"

# Check if query is provided
if [ $# -eq 0 ]; then
    echo "Usage: search <your query>"
    echo "Example: search \"latest AI news\""
    exit 1
fi

# Run the search
cd /home/icyberhack/Project-100/ollama_websearch
deno run --allow-net --allow-env main.ts "$*"
