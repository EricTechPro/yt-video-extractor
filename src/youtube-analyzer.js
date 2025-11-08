#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");
const {
  getSubtitles,
} = require("youtube-captions-scraper");
const { program } = require("commander");
const inquirer = require("inquirer");

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

class YouTubeAnalyzer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl =
      "https://www.googleapis.com/youtube/v3";
  }

  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    throw new Error(
      "Invalid YouTube URL"
    );
  }

  async fetchVideoInfo(videoId) {
    const endpoint = `${this.baseUrl}/videos?part=snippet,statistics&id=${videoId}&key=${this.apiKey}`;

    return new Promise(
      (resolve, reject) => {
        https
          .get(endpoint, (res) => {
            let data = "";

            res.on("data", (chunk) => {
              data += chunk;
            });

            res.on("end", () => {
              try {
                const response =
                  JSON.parse(data);
                if (
                  response.items &&
                  response.items
                    .length > 0
                ) {
                  resolve(
                    response.items[0]
                  );
                } else {
                  reject(
                    new Error(
                      "Video not found"
                    )
                  );
                }
              } catch (error) {
                reject(
                  new Error(
                    "Failed to parse response"
                  )
                );
              }
            });
          })
          .on("error", reject);
      }
    );
  }

  async fetchComments(
    videoId,
    maxResults = 20
  ) {
    const endpoint = `${this.baseUrl}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance&key=${this.apiKey}`;

    return new Promise(
      (resolve, reject) => {
        https
          .get(endpoint, (res) => {
            let data = "";

            res.on("data", (chunk) => {
              data += chunk;
            });

            res.on("end", () => {
              try {
                const response =
                  JSON.parse(data);
                if (response.items) {
                  resolve(
                    response.items
                  );
                } else {
                  resolve([]);
                }
              } catch (error) {
                reject(
                  new Error(
                    "Failed to parse comments response"
                  )
                );
              }
            });
          })
          .on("error", reject);
      }
    );
  }

  async fetchTranscript(videoId) {
    try {
      console.log(
        `Attempting to fetch transcript for video ID: ${videoId}`
      );

      // Try to get subtitles in English first
      const subtitles =
        await getSubtitles({
          videoID: videoId,
          lang: "en",
        });

      if (
        subtitles &&
        subtitles.length > 0
      ) {
        const transcriptText = subtitles
          .map((item) => item.text)
          .join(" ");
        console.log(
          `Successfully fetched transcript (${transcriptText.length} characters)`
        );
        return transcriptText;
      } else {
        throw new Error(
          "No transcript content found"
        );
      }
    } catch (error) {
      // Try without language specification
      try {
        console.log(
          "Trying to fetch transcript without language specification..."
        );
        const subtitles =
          await getSubtitles({
            videoID: videoId,
          });

        if (
          subtitles &&
          subtitles.length > 0
        ) {
          const transcriptText =
            subtitles
              .map((item) => item.text)
              .join(" ");
          console.log(
            `Successfully fetched transcript (${transcriptText.length} characters)`
          );
          return transcriptText;
        }
      } catch (fallbackError) {
        console.log(
          `Fallback also failed: ${fallbackError.message}`
        );
      }

      console.log(
        `Transcript fetch failed: ${error.message}`
      );
      throw new Error(
        `Transcript not available: ${error.message}`
      );
    }
  }

  extractKeywordsFromDescription(
    description
  ) {
    // Extract hashtags
    const hashtags =
      description.match(/#[\w]+/g) ||
      [];

    // Extract keywords from common patterns
    const keywords = [];

    // Add hashtags without the #
    hashtags.forEach((tag) =>
      keywords.push(tag.substring(1))
    );

    // Look for keyword-like patterns in description
    const lines =
      description.split("\n");
    lines.forEach((line) => {
      // Look for lines that might contain keywords (short phrases, tech terms)
      if (
        line.length < 100 &&
        (line.includes("Code") ||
          line.includes("Tips") ||
          line.includes("Tricks"))
      ) {
        const words = line
          .split(/[\s,]+/)
          .filter(
            (word) =>
              word.length > 2 &&
              !word.includes("http") &&
              !word.includes("@") &&
              !word.includes(".")
          );
        keywords.push(
          ...words.slice(0, 3)
        );
      }
    });

    return [...new Set(keywords)].slice(
      0,
      10
    );
  }

  getNextFileName() {
    const outputDir = path.join(__dirname, '..', 'outputs');
    let counter = 1;
    while (
      fs.existsSync(
        path.join(outputDir, `competitor-${counter}.md`)
      )
    ) {
      counter++;
    }
    return path.join(outputDir, `competitor-${counter}.md`);
  }

  generateMarkdown(
    videoInfo,
    originalUrl,
    comments = [],
    transcript = ""
  ) {
    const snippet = videoInfo.snippet;
    const stats = videoInfo.statistics;

    // Extract keywords from description if tags aren't available
    const keywords =
      snippet.tags ||
      this.extractKeywordsFromDescription(
        snippet.description
      );
    const keywordsText =
      keywords.length > 0
        ? keywords.join(", ")
        : "No keywords found";

    // Format comments
    let commentsSection = "";
    if (comments.length > 0) {
      commentsSection = comments
        .slice(0, 10)
        .map((commentThread, index) => {
          const comment =
            commentThread.snippet
              .topLevelComment.snippet;
          return `**Comment ${
            index + 1
          }:** ${
            comment.authorDisplayName
          }
${comment.textDisplay}
Likes: ${comment.likeCount || 0}
---`;
        })
        .join("\n\n");
    } else {
      commentsSection =
        "Comments not available or disabled for this video";
    }

    // Handle transcript
    let transcriptSection = transcript;
    if (!transcript) {
      transcriptSection = `[Transcript not available via automated API]

To manually get the transcript:
1. Go to the video on YouTube
2. Click the "..." menu below the video
3. Select "Show transcript" 
4. Copy and paste the transcript text here

Alternatively, you can use browser extensions or other tools to extract transcripts.`;
    }

    return `## Video Link:

${originalUrl}

## Video title:

${snippet.title}

## Video Description:

${snippet.description}

## Video Keywords:

${keywordsText}

## Video Statistics:

- Views: ${stats.viewCount || "N/A"}
- Likes: ${stats.likeCount || "N/A"}
- Comments: ${
      stats.commentCount || "N/A"
    }
- Published: ${new Date(
      snippet.publishedAt
    ).toLocaleDateString()}
- Channel: ${snippet.channelTitle}

## Top Comments:

${commentsSection}
`;
  }

  async analyze(url, maxComments = 20) {
    try {
      const videoId =
        this.extractVideoId(url);
      console.log(
        "Fetching video info..."
      );
      const videoInfo =
        await this.fetchVideoInfo(
          videoId
        );

      console.log(
        `Fetching up to ${maxComments} comments...`
      );
      let comments = [];
      try {
        comments =
          await this.fetchComments(
            videoId,
            maxComments
          );
      } catch (error) {
        console.log(
          "Comments unavailable:",
          error.message
        );
      }

      console.log(
        "Fetching transcript..."
      );
      let transcript = "";
      try {
        transcript =
          await this.fetchTranscript(
            videoId
          );
        console.log(
          `- Transcript fetched (${transcript.length} characters)`
        );
      } catch (error) {
        console.log(
          "Transcript unavailable:",
          error.message
        );
      }

      const markdown =
        this.generateMarkdown(
          videoInfo,
          url,
          comments,
          transcript
        );
      const fileName =
        this.getNextFileName();

      fs.writeFileSync(
        fileName,
        markdown
      );
      console.log(
        `Analysis saved to: ${fileName}`
      );
      console.log(
        `- Found ${comments.length} comments`
      );

      return {
        fileName,
        videoInfo,
        comments,
        transcript,
      };
    } catch (error) {
      console.error(
        "Error analyzing video:",
        error.message
      );
      throw error;
    }
  }
}

async function analyzeVideo(analyzer, url, maxComments) {
  console.log("");
  console.log("🚀 Starting YouTube video analysis...");
  console.log("📹 URL:", url);
  console.log("");

  try {
    const result = await analyzer.analyze(url, maxComments);
    console.log("");
    console.log("✅ Analysis complete!");
    console.log("📄 File created:", result.fileName);
    console.log("📊 Video stats:");
    console.log(`   - Title: ${result.videoInfo.snippet.title}`);
    console.log(`   - Views: ${result.videoInfo.statistics.viewCount || "N/A"}`);
    console.log(`   - Comments analyzed: ${result.comments.length}`);
    console.log(`   - Transcript: ${result.transcript ? "Available" : "Not available"}`);
    console.log("");
    return true;
  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
    console.log("");
    return false;
  }
}

async function main() {
  // Parse command-line arguments
  program
    .name("youtube-analyzer")
    .description("Analyze YouTube videos and extract metadata, comments, and transcripts")
    .argument("[url]", "YouTube video URL to analyze")
    .option("-c, --comments <number>", "Maximum number of comments to fetch", "20")
    .parse();

  const options = program.opts();
  const args = program.args;

  // Check for API key
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: API key not found");
    console.error("Please create a .env file with YOUTUBE_API_KEY=your_key");
    console.error("See .env.example for reference");
    process.exit(1);
  }

  const analyzer = new YouTubeAnalyzer(apiKey);
  let continueAnalyzing = true;
  let currentUrl = args[0] || null;
  let maxComments = parseInt(options.comments);

  console.log("🎬 YouTube Video Analyzer - Interactive Mode");
  console.log("============================================");

  // Main interactive loop
  while (continueAnalyzing) {
    // If no URL provided (or it's a subsequent iteration), prompt for one
    if (!currentUrl) {
      const urlAnswer = await inquirer.prompt([
        {
          type: "input",
          name: "url",
          message: "Enter YouTube video URL:",
          validate: (input) => {
            if (!input || input.trim() === "") {
              return "Please enter a valid URL";
            }
            return true;
          },
        },
      ]);
      currentUrl = urlAnswer.url;

      // Ask for custom comment count
      const commentsAnswer = await inquirer.prompt([
        {
          type: "input",
          name: "comments",
          message: "Maximum number of comments to fetch:",
          default: "20",
          validate: (input) => {
            const num = parseInt(input);
            if (isNaN(num) || num < 1 || num > 100) {
              return "Please enter a number between 1 and 100";
            }
            return true;
          },
        },
      ]);
      maxComments = parseInt(commentsAnswer.comments);
    }

    // Analyze the video
    await analyzeVideo(analyzer, currentUrl, maxComments);

    // Ask if user wants to analyze another video
    const continueAnswer = await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message: "Analyze another video?",
        default: true,
      },
    ]);

    continueAnalyzing = continueAnswer.continue;
    currentUrl = null; // Reset URL for next iteration
  }

  console.log("👋 Thanks for using YouTube Video Analyzer!");
}

if (require.main === module) {
  main();
}

module.exports = YouTubeAnalyzer;
