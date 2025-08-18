import { Readability } from "@paoramen/cheer-reader";

import ollama from "ollama";
import * as cheerio from "cheerio";

const searchUrl = Deno.env.get("SEARCH_URL");
const query = Deno.args.join(" ");

console.log(`Query: ${query}`);
const urls = await getNewsUrls(query);
const alltexts = await getCleanedText(urls);
await answerQuery(query, alltexts);

async function getNewsUrls(query: string) {
	const searchResults = await fetch(`${searchUrl}?q=${query}&format=json`);
	const searchResultsJson: { results: Array<{ url: string }> } =
		await searchResults.json();
	const urls = searchResultsJson.results
		.map((result) => result.url)
		.slice(0, 3); // Get top 3 results instead of just 1
	return urls;
}

async function getCleanedText(urls: string[]) {
	const texts = [];
	for await (const url of urls) {
		try {
			console.log(`Fetching ${url}`);
			const getUrl = await fetch(url, {
				// Add proper headers to appear as a real browser
				headers: {
					'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate, br',
					'Connection': 'keep-alive',
					'Upgrade-Insecure-Requests': '1',
				}
			});
			
			if (!getUrl.ok) {
				console.warn(`⚠️  Failed to fetch ${url}: ${getUrl.status} ${getUrl.statusText}`);
				continue;
			}
			
			const html = await getUrl.text();
			const text = htmlToText(html);
			texts.push(`Source: ${url}\n${text}\n\n`);
		} catch (error) {
			console.warn(`⚠️  Error fetching ${url}: ${error.message}`);
			// Continue with other URLs instead of failing completely
			continue;
		}
	}
	return texts;
}

function htmlToText(html: string) {
	const $ = cheerio.load(html);

  // Thanks to the comment on the YouTube video from @eliaspereirah for suggesting 
  // using Mozilla Readability. I used a variant that made it easier to use with 
  // cheerio. Definitely simplifies things
		const text = new Readability($).parse();

  // What I had before

	// $("script, source, style, head, img, svg, a, form, link, iframe").remove();
	// $("*").removeClass();
	// $("*").each((_, el) => {
	// 	if (el.type === "tag" || el.type === "script" || el.type === "style") {
	// 		for (const attr of Object.keys(el.attribs || {})) {
	// 			if (attr.startsWith("data-")) {
	// 				$(el).removeAttr(attr);
	// 			}
	// 		}
	// 	}
	// });
	// const text = $("body").text().replace(/\s+/g, " ");

	return text.textContent;
}

async function answerQuery(query: string, texts: string[]) {
	const result = await ollama.generate({
		model: "llama3.2:1b",
		prompt: `${query}. Summarize the information and provide an answer. Use only the information in the following articles to answer the question: ${texts.join("\n\n")}`,
		stream: true,
		options: {
			num_ctx: 16000,
		},
	});
	for await (const chunk of result) {
		if (chunk.done !== true) {
			await Deno.stdout.write(new TextEncoder().encode(chunk.response));
		}
	}
}
