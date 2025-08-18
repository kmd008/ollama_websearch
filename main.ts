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

// Configuration: Get search URL from environment (defaults to SearXNG instance)
const searchUrl = Deno.env.get("SEARCH_URL");
// Get user query from command line arguments
const query = Deno.args.join(" ");

// Main execution flow with beautiful formatting
console.log('\n🔍 Ollama Web Search - AI-Powered Research Assistant');
console.log('═'.repeat(60));
console.log(`📝 Query: ${query}`);
console.log('═'.repeat(60));

const urls = await getNewsUrls(query);        // 1. Search for relevant URLs
const alltexts = await getCleanedText(urls);  // 2. Extract clean text from URLs

// Beautiful separator before AI response
console.log('\n🤖 AI Analysis & Summary:');
console.log('═'.repeat(60));
await answerQuery(query, alltexts);           // 3. Generate AI summary
console.log('\n' + '═'.repeat(60));
console.log('✨ Search completed successfully!\n');

/**
 * Searches for URLs using SearXNG and returns top results
 * 
 * @param query - The search query string
 * @returns Promise<string[]> - Array of URLs from search results
 */
async function getNewsUrls(query: string) {
	// Query SearXNG instance for search results in JSON format
	const searchResults = await fetch(`${searchUrl}?q=${query}&format=json`);
	
	// Parse the JSON response to extract URL array
	const searchResultsJson: { results: Array<{ url: string }> } =
		await searchResults.json();
	
	// Extract URLs from results and limit to top 3 for performance
	const urls = searchResultsJson.results
		.map((result) => result.url)
		.slice(0, 3); // Get top 3 results for faster processing
	
	return urls;
}

/**
 * Fetches and extracts clean text content from an array of URLs
 * 
 * @param urls - Array of URLs to fetch content from
 * @returns Promise<string[]> - Array of cleaned text content with source attribution
 */
async function getCleanedText(urls: string[]) {
	const texts: string[] = [];
	
	// Process each URL with robust error handling
	for await (const url of urls) {
		try {
			console.log(`🌐 Fetching: ${url}`);
			
			// Fetch URL with browser-like headers to avoid bot detection
			const getUrl = await fetch(url, {
				headers: {
					// Mimic a real browser to prevent blocking
					'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate, br',
					'Connection': 'keep-alive',
					'Upgrade-Insecure-Requests': '1',
				}
			});
			
			// Check if the request was successful
			if (!getUrl.ok) {
				console.warn(`❌ Failed to fetch: ${getUrl.status} ${getUrl.statusText}`);
				continue; // Skip this URL and try the next one
			}
			
			// Extract HTML content and convert to clean text
			const html = await getUrl.text();
			const text = htmlToText(html);
			
			// Add source attribution with beautiful formatting
			texts.push(`📰 Source: ${url}\n${text}\n${'─'.repeat(80)}\n`);
			
		} catch (error) {
			// Handle network errors, SSL issues, etc. gracefully
			console.warn(`⚠️  Network error: ${error.message}`);
			continue; // Continue processing other URLs instead of failing completely
		}
	}
	
	return texts;
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
 * Generates AI-powered summary and answer using Ollama
 * 
 * @param query - The original user query
 * @param texts - Array of cleaned text content from web sources
 */
async function answerQuery(query: string, texts: string[]) {
	// Configure Ollama to generate a response using the lightweight llama3.2:1b model
	const result = await ollama.generate({
		model: "llama3.2:1b",  // Fast, lightweight model suitable for summarization
		
		// Construct enhanced prompt with clear instructions for structured output
		prompt: `Query: "${query}"

Please provide a comprehensive, well-structured answer based on the following sources. Format your response clearly and cite the information appropriately.

Sources:
${texts.join("\n")}

Instructions:
- Provide a clear, informative summary
- Use the information from the sources above
- Structure your response logically
- Be concise but thorough`,
		
		stream: true,  // Enable streaming for real-time output
		
		options: {
			num_ctx: 16000,  // Large context window to handle multiple articles
		},
	});
	
	// Stream the AI response to stdout in real-time
	for await (const chunk of result) {
		if (chunk.done !== true) {
			// Write each chunk of the response as it's generated
			await Deno.stdout.write(new TextEncoder().encode(chunk.response));
		}
	}
}
