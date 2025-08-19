/**
 * Ollama Web Search - AI-Powered Web Search with Summarization
 * 
 * This application combines real-time web search with AI-powered summarization
 * using SearXNG for search and Ollama for natural language processing.
 * 
 * Author: icyberhack
 * Inspired by: Matt Williams (@technovangelist)
 * License: MIT
 */

// Import dependencies for web scraping and AI processing
import { Readability } from "@paoramen/cheer-reader";  // Mozilla Readability for clean text extraction
import ollama from "ollama";                           // Ollama client for local AI models
import * as cheerio from "cheerio";                    // jQuery-like server-side HTML manipulation

// Cache and performance tracking
interface CacheEntry {
  content: string;
  timestamp: number;
  hits: number;
}

interface PerformanceMetrics {
  startTime: number;
  searchTime: number;
  fetchTime: number;
  aiTime: number;
  totalUrls: number;
  successfulUrls: number;
  cacheHits: number;
  totalTokens: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100;
  private ttl = 1000 * 60 * 60; // 1 hour
  
  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    entry.hits++;
    return entry.content;
  }
  
  set(key: string, content: string): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < this.maxSize * 0.2; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
    
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      hits: 0
    });
  }
  
  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageAge: entries.length > 0 
        ? (Date.now() - entries.reduce((sum, entry) => sum + entry.timestamp, 0) / entries.length) / 1000 / 60
        : 0
    };
  }
}

const cache = new SimpleCache();
const metrics: PerformanceMetrics = {
  startTime: Date.now(),
  searchTime: 0,
  fetchTime: 0,
  aiTime: 0,
  totalUrls: 0,
  successfulUrls: 0,
  cacheHits: 0,
  totalTokens: 0
};

// Enhanced error logging system
interface LogLevel {
  ERROR: string;
  WARN: string;
  INFO: string;
  DEBUG: string;
}

const LOG_LEVELS: LogLevel = {
  ERROR: '🔴',
  WARN: '🟡',
  INFO: '🔵',
  DEBUG: '🟢'
};

function log(level: keyof LogLevel, message: string, error?: Error) {
  const timestamp = new Date().toISOString();
  console.error(`${LOG_LEVELS[level]} [${timestamp}] ${message}`);
  if (error && level === 'ERROR') {
    console.error(`   Stack: ${error.stack}`);
  }
}

// Enhanced configuration with validation
interface Config {
  searchUrl: string;
  maxResults: number;
  ollamaModel: string;
  timeout: number;
  retryAttempts: number;
  outputFormat: string;
}

const DEFAULT_CONFIG: Config = {
  searchUrl: "http://localhost:9999/search",
  maxResults: 5,
  ollamaModel: "llama3.2:1b",
  timeout: 30000,
  retryAttempts: 3,
  outputFormat: "console"
};

function loadConfig(): Config {
  const config = { ...DEFAULT_CONFIG };
  
  // Load from environment variables with validation
  if (Deno.env.get("SEARCH_URL")) {
    try {
      new URL(Deno.env.get("SEARCH_URL")!);
      config.searchUrl = Deno.env.get("SEARCH_URL")!;
    } catch {
      log('WARN', `Invalid SEARCH_URL provided, using default: ${config.searchUrl}`);
    }
  }
  
  if (Deno.env.get("MAX_RESULTS")) {
    const maxResults = parseInt(Deno.env.get("MAX_RESULTS")!);
    if (!isNaN(maxResults) && maxResults > 0 && maxResults <= 20) {
      config.maxResults = maxResults;
    } else {
      log('WARN', `Invalid MAX_RESULTS, using default: ${config.maxResults}`);
    }
  }
  
  if (Deno.env.get("OLLAMA_MODEL")) {
    config.ollamaModel = Deno.env.get("OLLAMA_MODEL")!;
  }
  
  if (Deno.env.get("TIMEOUT")) {
    const timeout = parseInt(Deno.env.get("TIMEOUT")!);
    if (!isNaN(timeout) && timeout > 0) {
      config.timeout = timeout;
    }
  }
  
  return config;
}

const config = loadConfig();

// Get user query from command line arguments with validation
const query = Deno.args.join(" ").trim();

if (!query) {
  log('ERROR', 'No search query provided');
  console.log('❌ Error: Please provide a search query');
  console.log('Usage: deno run --allow-net --allow-env main.ts "your search query"');
  Deno.exit(1);
}

// Enhanced main execution flow with comprehensive error handling and metrics
async function main() {
  try {
    // Beautiful header with performance info
    console.log('\n🔍 Ollama Web Search - AI-Powered Research Assistant v2.0');
    console.log('═'.repeat(70));
    console.log(`📝 Query: ${query}`);
    console.log(`⚙️  Model: ${config.ollamaModel} | Results: ${config.maxResults} | Cache: ${cache.getStats().size} items`);
    console.log('═'.repeat(70));

    // 1. Search phase with timing
    const searchStart = Date.now();
    const urls = await getNewsUrls(query);
    metrics.searchTime = Date.now() - searchStart;
    metrics.totalUrls = urls.length;
    
    if (urls.length === 0) {
      log('WARN', 'No search results found');
      console.log('⚠️  No search results found. Please try a different query.');
      displayMetrics();
      return;
    }
    
    // 2. Content fetch phase with timing
    const fetchStart = Date.now();
    const alltexts = await getCleanedText(urls);
    metrics.fetchTime = Date.now() - fetchStart;
    metrics.successfulUrls = alltexts.length;
    
    if (alltexts.length === 0) {
      log('WARN', 'No readable content extracted from search results');
      console.log('⚠️  No readable content found. Please try a different query.');
      displayMetrics();
      return;
    }

    // 3. AI response phase with timing
    console.log('\n🤖 AI Analysis & Summary:');
    console.log('═'.repeat(70));
    
    const aiStart = Date.now();
    await answerQuery(query, alltexts);
    metrics.aiTime = Date.now() - aiStart;
    
    console.log('\n' + '═'.repeat(70));
    console.log('✨ Search completed successfully!\n');
    
    // Display performance metrics
    displayMetrics();
    
  } catch (error) {
    log('ERROR', 'Application failed with unexpected error', error as Error);
    console.log('❌ An unexpected error occurred. Please check your configuration and try again.');
    
    // Provide helpful suggestions
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('• Ensure SearXNG is running on the configured URL');
    console.log('• Check that Ollama is running and the model is available');
    console.log('• Verify your internet connection');
    console.log('• Try a simpler search query');
    
    displayMetrics();
    Deno.exit(1);
  }
}

/**
 * Display performance metrics and statistics
 */
function displayMetrics() {
  const totalTime = Date.now() - metrics.startTime;
  const cacheStats = cache.getStats();
  
  console.log('\n📊 Performance Metrics:');
  console.log('─'.repeat(50));
  console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`🔍 Search: ${(metrics.searchTime / 1000).toFixed(2)}s | 🌐 Fetch: ${(metrics.fetchTime / 1000).toFixed(2)}s | 🤖 AI: ${(metrics.aiTime / 1000).toFixed(2)}s`);
  console.log(`📄 URLs: ${metrics.successfulUrls}/${metrics.totalUrls} successful`);
  console.log(`💾 Cache: ${cacheStats.size} items, ${cacheStats.totalHits} hits, ${cacheStats.averageAge.toFixed(1)}min avg age`);
  if (metrics.totalTokens > 0) {
    console.log(`🎯 Tokens: ${metrics.totalTokens} generated`);
  }
  console.log('─'.repeat(50));
}

// Run the main function
await main();

/**
 * Searches for URLs using SearXNG and returns top results with enhanced error handling
 * 
 * @param query - The search query string
 * @returns Promise<string[]> - Array of URLs from search results
 */
async function getNewsUrls(query: string): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
  try {
    log('INFO', `Searching for: "${query}"`);
    
    // Query SearXNG instance with timeout and proper error handling
    const searchUrl = `${config.searchUrl}?q=${encodeURIComponent(query)}&format=json&categories=general&time_range=`;
    
    const searchResults = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Ollama-WebSearch/2.0',
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!searchResults.ok) {
      throw new Error(`Search API returned ${searchResults.status}: ${searchResults.statusText}`);
    }
    
    // Parse the JSON response to extract URL array
    const searchResultsJson: { results?: Array<{ url: string; title?: string; content?: string }> } = 
      await searchResults.json();
    
    if (!searchResultsJson.results || searchResultsJson.results.length === 0) {
      log('WARN', 'No search results returned from SearXNG');
      return [];
    }
    
    // Extract URLs from results and apply intelligent filtering
    const urls = searchResultsJson.results
      .filter(result => {
        try {
          new URL(result.url);
          return !result.url.includes('reddit.com/r/') &&  // Skip Reddit threads
                 !result.url.includes('twitter.com') &&     // Skip social media
                 !result.url.includes('facebook.com') &&
                 !result.url.endsWith('.pdf') &&            // Skip PDFs
                 !result.url.includes('youtube.com/watch'); // Skip videos
        } catch {
          return false; // Invalid URL
        }
      })
      .map(result => result.url)
      .slice(0, config.maxResults);
    
    log('INFO', `Found ${urls.length} valid URLs to process`);
    return urls;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      log('ERROR', `Search request timed out after ${config.timeout}ms`);
      throw new Error('Search request timed out. Please try again or check your SearXNG instance.');
    }
    
    log('ERROR', 'Failed to fetch search results', error as Error);
    throw new Error(`Search failed: ${(error as Error).message}`);
  }
}

/**
 * Fetches and extracts clean text content from an array of URLs with parallel processing
 * 
 * @param urls - Array of URLs to fetch content from
 * @returns Promise<string[]> - Array of cleaned text content with source attribution
 */
async function getCleanedText(urls: string[]): Promise<string[]> {
  if (urls.length === 0) {
    return [];
  }

  console.log(`🌐 Fetching content from ${urls.length} URLs in parallel...`);
  
  // Parallel fetch with individual error handling and caching
  const fetchPromises = urls.map(async (url, index): Promise<string | null> => {
    // Check cache first
    const cacheKey = `url:${url}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`💾 [${index + 1}/${urls.length}] Cache hit: ${url}`);
      metrics.cacheHits++;
      return cached;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      console.log(`🌐 [${index + 1}/${urls.length}] Fetching: ${url}`);
      
      // Enhanced headers to avoid bot detection
      const getUrl = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!getUrl.ok) {
        log('WARN', `HTTP ${getUrl.status} for ${url}: ${getUrl.statusText}`);
        return null;
      }
      
      // Check content type
      const contentType = getUrl.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        log('WARN', `Skipping non-HTML content: ${contentType} for ${url}`);
        return null;
      }
      
      const html = await getUrl.text();
      
      if (!html || html.length < 100) {
        log('WARN', `Content too short or empty for ${url}`);
        return null;
      }
      
      const text = htmlToText(html);
      
      if (!text || text.length < 50) {
        log('WARN', `Extracted text too short for ${url}`);
        return null;
      }
      
      log('INFO', `Successfully processed ${url} (${text.length} characters)`);
      
      // Enhanced source attribution with metadata
      const result = `📰 Source: ${url}
📊 Content length: ${text.length} characters
📅 Fetched: ${new Date().toISOString()}

${text}

${'─'.repeat(80)}
`;
      
      // Cache the successful result
      cache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        log('WARN', `Timeout fetching ${url} after ${config.timeout}ms`);
      } else {
        log('WARN', `Network error for ${url}: ${(error as Error).message}`);
      }
      
      return null;
    }
  });
  
  // Wait for all fetch operations to complete
  const results = await Promise.all(fetchPromises);
  
  // Filter out failed requests and return successful ones
  const successfulTexts = results.filter((text): text is string => text !== null);
  
  console.log(`✅ Successfully processed ${successfulTexts.length}/${urls.length} URLs`);
  
  if (successfulTexts.length === 0) {
    log('WARN', 'No content could be extracted from any URLs');
  }
  
  return successfulTexts;
}

/**
 * Converts HTML content to clean, readable text using Mozilla Readability
 * 
 * @param html - Raw HTML content from webpage
 * @returns string - Clean text content suitable for AI processing
 */
function htmlToText(html: string) {
	// Load HTML into cheerio for jQuery-like manipulation
	const $ = cheerio.load(html);

	// Use Mozilla Readability algorithm for clean text extraction
	// Thanks to @eliaspereirah for suggesting this approach in the YouTube comments
	// This provides much cleaner results than manual HTML parsing
	const text = new Readability($).parse();

	/* Alternative manual approach (kept for reference):
	 * 
	 * Remove unwanted elements that don't contribute to content
	 * $("script, source, style, head, img, svg, a, form, link, iframe").remove();
	 * 
	 * Clean up CSS classes and data attributes
	 * $("*").removeClass();
	 * $("*").each((_, el) => {
	 * 	if (el.type === "tag" || el.type === "script" || el.type === "style") {
	 * 		for (const attr of Object.keys(el.attribs || {})) {
	 * 			if (attr.startsWith("data-")) {
	 * 				$(el).removeAttr(attr);
	 * 			}
	 * 		}
	 * 	}
	 * });
	 * 
	 * Extract text and normalize whitespace
	 * const text = $("body").text().replace(/\s+/g, " ");
	 */

	// Return the cleaned text content
	return text.textContent;
}

/**
 * Generates AI-powered summary and answer using Ollama with multiple model support
 * 
 * @param query - The original user query
 * @param texts - Array of cleaned text content from web sources
 */
async function answerQuery(query: string, texts: string[]): Promise<void> {
  // Fallback models in order of preference
  const fallbackModels = [
    config.ollamaModel,
    "llama3.2:3b",
    "llama3.2:1b",
    "llama3.1:8b",
    "mistral:7b",
    "qwen2.5:7b"
  ];
  
  // Combine all text content
  const combinedContent = texts.join("\n");
  const contentLength = combinedContent.length;
  
  log('INFO', `Generating AI response using model: ${config.ollamaModel}`);
  log('INFO', `Processing ${contentLength} characters of content`);
  
  // Intelligent context window sizing based on content length
  let contextSize = 16000; // Default
  if (contentLength > 50000) contextSize = 32000;
  if (contentLength > 100000) contextSize = 65536;
  
  // Enhanced prompt with better structure and instructions
  const enhancedPrompt = `# Web Search Query Analysis

**Query:** "${query}"

**Task:** Provide a comprehensive, well-structured analysis based on the following web sources.

## Source Content:
${combinedContent}

## Instructions:
1. **Analyze the content** thoroughly and provide accurate information
2. **Structure your response** with clear headings and sections
3. **Cite key information** but don't overwhelm with too many source references
4. **Be objective** and present multiple perspectives when relevant
5. **Highlight important facts** and key takeaways
6. **Keep it comprehensive** but readable
7. **Use markdown formatting** for better readability

## Response Format:
- Start with a brief summary (2-3 sentences)
- Provide detailed analysis in organized sections
- Include key facts, figures, and dates when available
- End with key takeaways or implications

**Begin your analysis:**`;

  let lastError: Error | null = null;
  
  // Try models in order until one works
  for (const modelName of fallbackModels) {
    try {
      log('INFO', `Attempting to use model: ${modelName}`);
      
      const result = await ollama.generate({
        model: modelName,
        prompt: enhancedPrompt,
        stream: true,
        options: {
          num_ctx: contextSize,
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1,
          num_predict: 2048,
        },
      });
      
      let hasStarted = false;
      let tokenCount = 0;
      
      // Stream the AI response with enhanced feedback
      for await (const chunk of result) {
        if (!hasStarted) {
          console.log(`🤖 Generating response with ${modelName}...\n`);
          hasStarted = true;
        }
        
        if (chunk.done !== true && chunk.response) {
          tokenCount++;
          await Deno.stdout.write(new TextEncoder().encode(chunk.response));
        }
        
        if (chunk.done) {
          metrics.totalTokens = tokenCount;
          log('INFO', `Response generated successfully with ${modelName} (${tokenCount} tokens)`);
          return; // Success - exit function
        }
      }
      
      return; // If we get here, generation completed successfully
      
    } catch (error) {
      lastError = error as Error;
      log('WARN', `Model ${modelName} failed: ${lastError.message}`);
      
      // If it's a model not found error, try the next model
      if (lastError.message.includes('model') && lastError.message.includes('not found')) {
        continue;
      }
      
      // If it's a connection error, try next model
      if (lastError.message.includes('connect') || lastError.message.includes('ECONNREFUSED')) {
        continue;
      }
      
      // For other errors, also try next model but log more details
      log('ERROR', `Unexpected error with ${modelName}`, lastError);
      continue;
    }
  }
  
  // If all models failed
  log('ERROR', 'All AI models failed to generate response', lastError || new Error('Unknown error'));
  
  console.log('\n❌ Unable to generate AI response. Please check:');
  console.log('• Ollama is running: `ollama serve`');
  console.log('• At least one model is available: `ollama list`');
  console.log('• Install a model: `ollama pull llama3.2:1b`');
  console.log(`• Last error: ${lastError?.message || 'Unknown error'}`);
  
  throw new Error('AI response generation failed with all available models');
}
