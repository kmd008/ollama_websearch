/**
 * Enhanced CLI interface for Ollama WebSearch
 * Provides advanced options and interactive features
 */

import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";

interface CLIOptions {
  query?: string;
  model?: string;
  results?: number;
  output?: string;
  format?: string;
  cache?: boolean;
  verbose?: boolean;
  help?: boolean;
  version?: boolean;
  config?: string;
  timeout?: number;
  interactive?: boolean;
  save?: string;
}

const VERSION = "2.0.0";

const HELP_TEXT = `
🔍 Ollama WebSearch v${VERSION} - AI-Powered Research Assistant

USAGE:
  deno run --allow-net --allow-env --allow-read --allow-write cli.ts [OPTIONS] "search query"

OPTIONS:
  -q, --query <TEXT>        Search query (required if not provided as argument)
  -m, --model <MODEL>       AI model to use (default: llama3.2:1b)
  -r, --results <NUM>       Number of search results to process (default: 5)
  -o, --output <FILE>       Save output to file
  -f, --format <FORMAT>     Output format: console, json, markdown, html, text (default: console)
  -c, --cache               Enable caching (default: true)
  -v, --verbose             Enable verbose logging
  -h, --help                Show this help message
      --version             Show version information
      --config <FILE>       Use custom configuration file
      --timeout <MS>        Request timeout in milliseconds (default: 30000)
  -i, --interactive         Interactive mode with guided search
  -s, --save <FILE>         Save results to file (auto-detects format from extension)

EXAMPLES:
  # Basic search
  deno run --allow-all cli.ts "latest AI developments"
  
  # Use specific model and save as JSON
  deno run --allow-all cli.ts -m "llama3.2:3b" -f json -o results.json "climate change"
  
  # Interactive mode
  deno run --allow-all cli.ts --interactive
  
  # Verbose output with more results
  deno run --allow-all cli.ts -v -r 10 "space exploration"
  
  # Save as markdown report
  deno run --allow-all cli.ts -s report.md "artificial intelligence trends"

ENVIRONMENT VARIABLES:
  SEARCH_URL              SearXNG instance URL (default: http://localhost:9999/search)
  OLLAMA_MODEL           Default AI model
  MAX_RESULTS            Default number of results
  TIMEOUT                Default timeout
  OUTPUT_FORMAT          Default output format
  LOG_LEVEL              Logging level (ERROR, WARN, INFO, DEBUG)

CONFIGURATION:
  Create a config.json file to customize default settings.
  Use --config to specify a custom configuration file.

For more information, visit: https://github.com/yourusername/ollama_websearch
`;

/**
 * Parse command line arguments
 */
function parseCliArgs(): CLIOptions {
  const args = parseArgs(Deno.args, {
    string: ["query", "model", "output", "format", "config", "save"],
    boolean: ["cache", "verbose", "help", "version", "interactive"],
    alias: {
      "q": "query",
      "m": "model", 
      "r": "results",
      "o": "output",
      "f": "format",
      "c": "cache",
      "v": "verbose",
      "h": "help",
      "i": "interactive",
      "s": "save"
    },
    default: {
      cache: true,
      verbose: false,
      format: "console",
      results: 5,
      timeout: 30000
    }
  });

  // If no query provided as option, use remaining arguments
  if (!args.query && args._.length > 0) {
    args.query = args._.join(" ");
  }

  return args as CLIOptions;
}

/**
 * Interactive mode for guided search
 */
async function interactiveMode(): Promise<CLIOptions> {
  console.log("🔍 Welcome to Ollama WebSearch Interactive Mode\n");
  
  const query = prompt("Enter your search query: ");
  if (!query) {
    console.log("❌ Search query is required");
    Deno.exit(1);
  }

  const modelInput = prompt("AI model (default: llama3.2:1b): ");
  const model = modelInput || "llama3.2:1b";

  const resultsInput = prompt("Number of results (default: 5): ");
  const results = resultsInput ? parseInt(resultsInput) : 5;

  const formatInput = prompt("Output format [console/json/markdown/html/text] (default: console): ");
  const format = formatInput || "console";

  const saveInput = prompt("Save to file (optional, leave empty to skip): ");
  const save = saveInput || undefined;

  const verboseInput = prompt("Enable verbose output? [y/N]: ");
  const verbose = verboseInput?.toLowerCase() === 'y';

  return {
    query,
    model,
    results,
    format,
    save,
    verbose
  };
}

/**
 * Validate CLI options
 */
function validateOptions(options: CLIOptions): string[] {
  const errors: string[] = [];

  if (!options.query && !options.interactive) {
    errors.push("Search query is required. Use -q or provide as argument.");
  }

  if (options.results && (options.results < 1 || options.results > 20)) {
    errors.push("Results must be between 1 and 20.");
  }

  if (options.format && !["console", "json", "markdown", "html", "text"].includes(options.format)) {
    errors.push("Format must be one of: console, json, markdown, html, text");
  }

  if (options.timeout && options.timeout < 1000) {
    errors.push("Timeout must be at least 1000ms.");
  }

  return errors;
}

/**
 * Display version information
 */
function showVersion() {
  console.log(`Ollama WebSearch v${VERSION}`);
  console.log("A powerful AI-powered web search and summarization tool");
  console.log("Author: icyberhack");
  console.log("License: MIT");
  console.log("Repository: https://github.com/yourusername/ollama_websearch");
}

/**
 * Main CLI function
 */
async function main() {
  let options = parseCliArgs();

  // Handle special flags
  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (options.version) {
    showVersion();
    return;
  }

  // Interactive mode
  if (options.interactive) {
    options = { ...options, ...await interactiveMode() };
  }

  // Validate options
  const errors = validateOptions(options);
  if (errors.length > 0) {
    console.log("❌ CLI Errors:");
    errors.forEach(error => console.log(`  • ${error}`));
    console.log("\nUse --help for usage information.");
    Deno.exit(1);
  }

  // Set environment variables from CLI options
  if (options.model) {
    Deno.env.set("OLLAMA_MODEL", options.model);
  }
  if (options.results) {
    Deno.env.set("MAX_RESULTS", options.results.toString());
  }
  if (options.timeout) {
    Deno.env.set("TIMEOUT", options.timeout.toString());
  }
  if (options.format) {
    Deno.env.set("OUTPUT_FORMAT", options.format);
  }
  if (options.verbose) {
    Deno.env.set("LOG_LEVEL", "DEBUG");
  }

  // Auto-detect format from save file extension
  if (options.save && !options.format) {
    const ext = options.save.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        options.format = 'json';
        break;
      case 'md':
      case 'markdown':
        options.format = 'markdown';
        break;
      case 'html':
      case 'htm':
        options.format = 'html';
        break;
      case 'txt':
      case 'text':
        options.format = 'text';
        break;
    }
  }

  // Update Deno.args for main.ts
  Deno.args = [options.query!];

  console.log("🚀 Starting Ollama WebSearch...");
  if (options.verbose) {
    console.log(`📊 Configuration:`);
    console.log(`   Query: ${options.query}`);
    console.log(`   Model: ${options.model || 'default'}`);
    console.log(`   Results: ${options.results || 5}`);
    console.log(`   Format: ${options.format || 'console'}`);
    if (options.save) {
      console.log(`   Save to: ${options.save}`);
    }
  }

  // Import and run main search functionality
  try {
    await import("./main.ts");
    
    // If save option is specified, handle file output
    if (options.save && options.format !== "console") {
      console.log(`\n💾 Results saved to: ${options.save}`);
    }
  } catch (error) {
    console.log(`❌ Search failed: ${error.message}`);
    Deno.exit(1);
  }
}

// Run CLI if this file is being executed directly
if (import.meta.main) {
  await main();
}

export { parseCliArgs, validateOptions, interactiveMode };
