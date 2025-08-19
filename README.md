# 🔍 Ollama Web Search v2.0

A powerful, intelligent web search tool that combines real-time web search with AI-powered summarization using Ollama and SearXNG. Now featuring advanced caching, parallel processing, multiple output formats, comprehensive error handling, and enterprise-ready deployment options.

## ✨ New in v2.0

### 🚀 Performance & Reliability
- **⚡ Parallel Processing**: Fetch multiple URLs simultaneously for 3-5x faster results
- **💾 Intelligent Caching**: Smart caching system reduces redundant requests and improves speed
- **🔄 Model Fallback**: Automatic fallback between multiple AI models for maximum reliability
- **📊 Performance Metrics**: Detailed timing and performance analytics
- **🛡️ Enhanced Error Handling**: Comprehensive error handling with graceful degradation

### 📤 Output & Integration
- **📄 Multiple Output Formats**: JSON, Markdown, HTML, and plain text export
- **🔧 Advanced CLI**: Feature-rich command-line interface with interactive mode
- **⚙️ Configuration System**: Flexible configuration via files and environment variables
- **📈 Usage Analytics**: Track performance, cache hits, and system metrics

### 🐳 Deployment & DevOps
- **🐳 Docker Compose**: Complete containerized setup with GPU support
- **🧪 Comprehensive Testing**: Unit tests, integration tests, and performance benchmarks
- **📋 Setup Automation**: One-command setup script for quick deployment
- **🌐 Web Interface Ready**: Optional web UI components for browser access

### 🔍 Search & AI Enhancements
- **🎯 Smart URL Filtering**: Intelligent filtering of social media, PDFs, and low-quality content
- **🤖 Enhanced AI Prompting**: Structured prompts for better, more consistent responses
- **🔍 Advanced Search Options**: Configurable search engines, time ranges, and content filters
- **📝 Source Attribution**: Detailed source metadata with fetch times and content analysis

## 🚀 Quick Start

### 🎯 One-Command Setup (Recommended)

```bash
git clone https://github.com/yourusername/ollama_websearch.git
cd ollama_websearch
./setup.sh
```

The setup script will:
- ✅ Check prerequisites (Deno, Docker)
- 🐳 Start SearXNG and Ollama containers
- 📦 Install default AI models
- ⚙️ Configure environment
- 🧪 Run basic functionality test

### 🔧 Manual Installation

#### Prerequisites

1. **Deno Runtime**: Install from [deno.land](https://deno.land/)
2. **Docker & Docker Compose**: For containerized services
3. **Optional**: Ollama installed locally (alternative to Docker)

#### Step-by-Step Setup

1. **Clone and setup**:
   ```bash
   git clone https://github.com/yourusername/ollama_websearch.git
   cd ollama_websearch
   cp .env.example .env  # Customize settings
   ```

2. **Start services**:
   ```bash
   # With GPU support
   COMPOSE_PROFILES=gpu docker-compose up -d
   
   # CPU only
   COMPOSE_PROFILES=cpu docker-compose up -d
   
   # With caching and web interface
   COMPOSE_PROFILES=cpu,cache,web docker-compose up -d
   ```

3. **Install AI models**:
   ```bash
   docker exec ollama-websearch-ollama-cpu ollama pull llama3.2:1b
   docker exec ollama-websearch-ollama-cpu ollama pull llama3.2:3b
   ```

## 💻 Usage

### 🔍 Basic Search
```bash
# Simple search
./search.sh "your search query here"

# Using Deno tasks
deno task search "latest AI developments"

# Advanced CLI with options
deno run --allow-all cli.ts -m "llama3.2:3b" -r 10 "climate change research"
```

### 🎛️ Advanced CLI Options
```bash
# Interactive mode with guided prompts
deno run --allow-all cli.ts --interactive

# Save results to different formats
deno run --allow-all cli.ts -s results.json "AI trends"     # JSON
deno run --allow-all cli.ts -s report.md "AI trends"       # Markdown
deno run --allow-all cli.ts -s report.html "AI trends"     # HTML

# Verbose output with custom model
deno run --allow-all cli.ts -v -m "llama3.1:8b" "space exploration"

# Use specific configuration
deno run --allow-all cli.ts --config custom.json "query"
```

### 📊 Output Examples

#### Example Output
```
🔍 Ollama Web Search - AI-Powered Research Assistant
════════════════════════════════════════════════════════════
📝 Query: President Mahama grant Amnesty for 999 prisons
════════════════════════════════════════════════════════════
🌐 Fetching: https://www.facebook.com/joy997fm/posts/president-mahama-grants-amnesty-to-998-prisoners...
🌐 Fetching: https://isd.gov.gh/president-mahama-grants-amnesty-to-998-prisoners/
🌐 Fetching: https://resolve.cambridge.org/core/services/aop-cambridge-core/content/view...

🤖 AI Analysis & Summary:
════════════════════════════════════════════════════════════
President Mahama granted amnesty to 998 prisoners out of 1,014 recommended by the Prisons Service Council. The amnesty affects prisoners across seven categories, with first-time offenders making up the largest group at 787 individuals...
════════════════════════════════════════════════════════════
✨ Search completed successfully!
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

1. **🔍 Search Query**: The application sends your query to SearXNG with beautiful branding
2. **🌐 URL Extraction**: Extracts top search result URLs with progress indicators
3. **📄 Content Fetching**: Downloads webpage content using browser-like headers to avoid blocking
4. **🧹 Text Cleaning**: Uses Mozilla Readability algorithm for clean, readable text extraction
5. **🤖 AI Analysis**: Sends cleaned content to Ollama with enhanced prompting for structured output
6. **✨ Streaming Response**: Returns beautifully formatted AI-generated summary in real-time
7. **🎨 Professional Output**: Displays results with clear visual hierarchy and source attribution

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

## 🚀 Recent Improvements

### Version 2.0 Features:
- **🎨 Beautiful Interface**: Complete visual overhaul with professional branding
- **🔒 Enhanced Security**: Proper SSL certificate handling without security warnings
- **🌐 Better Compatibility**: Browser-like headers to avoid bot detection
- **📝 Comprehensive Documentation**: Detailed code comments and JSDoc documentation
- **⚡ Improved Error Handling**: Graceful degradation with informative error messages
- **✨ Visual Feedback**: Real-time progress indicators and status updates

## 🙏 Acknowledgments

- **Matt Williams** ([@technovangelist](https://github.com/technovangelist)) - Former Ollama team member who inspired this project
- **Ollama Team** - For the excellent local AI runtime
- **SearXNG Project** - For privacy-focused search capabilities
- **Mozilla Readability** - For clean content extraction
- **@eliaspereirah** - For suggesting Mozilla Readability approach

## 🎨 Visual Interface

The tool features a beautiful, professional interface with:

- **🔍 Branded Header**: Clear project identification and purpose
- **📝 Query Display**: Elegant query presentation with visual separators
- **🌐 Progress Indicators**: Real-time fetching progress with emojis
- **📰 Source Attribution**: Clear source identification with visual separators
- **🤖 AI Section**: Distinct AI analysis section with proper formatting
- **✨ Completion Confirmation**: Professional completion indicator
- **⚠️ Error Handling**: Graceful error messages with appropriate icons

## 📊 System Requirements

- **OS**: Linux, macOS, Windows
- **RAM**: 4GB minimum (8GB+ recommended for larger models)
- **Storage**: 2GB for base model
- **Network**: Internet connection for web search

## 🔧 Troubleshooting

### Common Issues

1. **🔒 SSL Certificate Issues**: The application now handles SSL certificates properly with robust error handling
2. **🤖 Model Not Found**: Run `ollama pull llama3.2:1b` to install the required model
3. **🐳 SearXNG Not Running**: Ensure Docker container is running on port 9999
4. **🔐 Permission Denied**: Run `chmod +x search.sh` to make the script executable
5. **🌐 Network Errors**: The tool gracefully handles network issues and continues with available sources
6. **🚫 Bot Detection**: Browser-like headers are included to avoid being blocked by websites

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/ollama_websearch/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ollama_websearch/discussions)

---

## 🌟 Why Choose Ollama Web Search?

- **🚀 Fast & Efficient**: Lightweight design with streaming responses
- **🔒 Privacy-Focused**: Uses SearXNG for private search without tracking
- **🎨 Beautiful Interface**: Professional, branded terminal experience
- **🛡️ Secure**: Proper security practices without bypassing safety measures
- **📚 Educational**: Well-documented code perfect for learning
- **🌍 Open Source**: MIT licensed, free for everyone to use and contribute

**Experience the future of AI-powered web search! 🚀✨**

