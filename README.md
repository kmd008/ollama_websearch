# 🔍 Ollama Web Search

An intelligent web search tool that combines real-time web search with AI-powered summarization using Ollama and SearXNG.

## ✨ Features

- **Real-time Web Search**: Integrates with SearXNG for comprehensive search results
- **AI-Powered Summarization**: Uses Ollama's language models to provide intelligent summaries
- **Multiple Source Aggregation**: Fetches and analyzes content from top search results
- **Clean Text Extraction**: Uses Mozilla Readability for clean content extraction
- **Command-line Interface**: Simple and intuitive terminal-based usage

## 🚀 Quick Start

### Prerequisites

1. **Deno Runtime**: Install from [deno.land](https://deno.land/)
2. **Ollama**: Install from [ollama.ai](https://ollama.ai/)
3. **SearXNG**: Set up a local instance (Docker recommended)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/ollama_websearch.git
   cd ollama_websearch
   ```

2. **Set up SearXNG (using Docker)**:
   ```bash
   # Pull and run SearXNG
   docker run -d --name searxng -p 9999:8080 searxng/searxng:latest
   ```

3. **Install Ollama models**:
   ```bash
   # Install the lightweight model used by default
   ollama pull llama3.2:1b
   ```

4. **Make the search script executable**:
   ```bash
   chmod +x search.sh
   ```

5. **Add to your shell profile** (optional but recommended):
   ```bash
   # Add this line to your ~/.zshrc or ~/.bashrc
   alias search="/path/to/ollama_websearch/search.sh"
   ```

### Usage

#### Basic Search
```bash
./search.sh "your search query here"
```

#### With Global Alias
```bash
search "latest AI developments"
```

#### Example Output
```
Query: President Mahama grant Amnesty for 999 prisons
Fetching https://www.facebook.com/joy997fm/posts/president-mahama-grants-amnesty-to-998-prisoners...
Fetching https://isd.gov.gh/president-mahama-grants-amnesty-to-998-prisoners/

President Mahama granted amnesty to 998 prisoners out of 1,014 recommended by the Prisons Service Council...
```

## 🛠️ Configuration

### Environment Variables

The application uses the following environment variables:

- `SEARCH_URL`: SearXNG instance URL (default: `http://localhost:9999/search`)

### Customization

#### Change the AI Model
Edit `main.ts` and modify the model parameter:
```typescript
const result = await ollama.generate({
    model: "llama3.2:3b", // Change to your preferred model
    // ...
});
```

#### Adjust Number of Search Results
Modify the slice parameter in `getNewsUrls()`:
```typescript
.slice(0, 5); // Change from 3 to 5 for more results
```

## 📁 Project Structure

```
ollama_websearch/
├── main.ts          # Main application logic
├── search.sh        # Shell script wrapper
├── deno.json        # Deno configuration
├── deno.lock        # Dependency lock file
├── README.md        # This file
├── LICENSE          # MIT License
└── .gitignore       # Git ignore rules
```

## 🧩 How It Works

1. **Search Query**: The application sends your query to SearXNG
2. **URL Extraction**: Extracts top search result URLs
3. **Content Fetching**: Downloads and processes webpage content
4. **Text Cleaning**: Uses Mozilla Readability for clean text extraction
5. **AI Analysis**: Sends the cleaned content to Ollama for summarization
6. **Streaming Response**: Returns AI-generated summary in real-time

## 🐳 Docker Setup (Alternative)

If you prefer using Docker for the entire setup:

```bash
# Start SearXNG
docker run -d --name searxng -p 9999:8080 searxng/searxng:latest

# Run Ollama in Docker (if not installed locally)
docker run -d --name ollama -p 11434:11434 ollama/ollama
docker exec -it ollama ollama pull llama3.2:1b
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/ollama_websearch.git
cd ollama_websearch

# Install dependencies (handled by Deno automatically)
deno run --allow-net --allow-env main.ts "test query"
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Matt Williams** ([@technovangelist](https://github.com/technovangelist)) - Former Ollama team member who inspired this project
- **Ollama Team** - For the excellent local AI runtime
- **SearXNG Project** - For privacy-focused search capabilities
- **Mozilla Readability** - For clean content extraction

## 📊 System Requirements

- **OS**: Linux, macOS, Windows
- **RAM**: 4GB minimum (8GB+ recommended for larger models)
- **Storage**: 2GB for base model
- **Network**: Internet connection for web search

## 🔧 Troubleshooting

### Common Issues

1. **Certificate Errors**: The script includes `--unsafely-ignore-certificate-errors` flag by default
2. **Model Not Found**: Run `ollama pull llama3.2:1b` to install the required model
3. **SearXNG Not Running**: Ensure Docker container is running on port 9999
4. **Permission Denied**: Run `chmod +x search.sh` to make the script executable

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/ollama_websearch/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ollama_websearch/discussions)

---

**Happy Searching! 🚀**

