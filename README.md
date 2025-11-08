# YouTube Video Extractor

A powerful CLI tool to extract comprehensive information from YouTube videos including metadata, statistics, comments, and transcripts. Perfect for competitor analysis, content research, and video intelligence gathering.

## Features

- **Interactive Terminal Interface**: Pass URLs via command-line or interactive prompts
- **Multi-Video Analysis**: Analyze multiple videos in one session
- **Video Metadata Extraction**: Title, description, channel info, publish date
- **Statistics**: View count, likes, comments count
- **Keywords Analysis**: Automatic extraction from tags and description
- **Top Comments**: Fetches and formats top relevant comments with engagement metrics
- **Customizable Comment Count**: Specify how many comments to fetch (1-100)
- **Transcript Support**: Automatically extracts video transcripts when available
- **Markdown Output**: Generates clean, organized markdown reports
- **Automatic File Naming**: Sequential numbering (competitor-1.md, competitor-2.md, etc.)

## Prerequisites

- Node.js (v14 or higher)
- YouTube Data API v3 Key ([Get one here](https://console.developers.google.com/))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/yt-video-extractor.git
cd yt-video-extractor
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API key:
```bash
cp .env.example .env
```

4. Edit `.env` and add your YouTube API key:
```
YOUTUBE_API_KEY=your_actual_api_key_here
```

## Usage

The tool offers flexible usage patterns - you can pass video URLs as command-line arguments or use interactive prompts.

### Method 1: Command-line Arguments (Quick)

Analyze a single video by passing the URL directly:

```bash
npm start https://youtu.be/VIDEO_ID
```

With custom comment count:

```bash
npm start https://youtu.be/VIDEO_ID --comments 50
```

Or using the full command:

```bash
node src/youtube-analyzer.js https://youtu.be/VIDEO_ID --comments 30
```

### Method 2: Interactive Mode (Multi-Video)

Run without arguments to enter interactive mode:

```bash
npm start
```

The tool will prompt you for:
1. Video URL to analyze
2. Number of comments to fetch (default: 20)
3. Whether to analyze another video after completion

This mode allows you to analyze multiple videos in one session!

### Command-line Options

- `[url]` - YouTube video URL (optional, will prompt if not provided)
- `-c, --comments <number>` - Maximum comments to fetch (default: 20, max: 100)
- `-h, --help` - Display help information

### Examples

```bash
# Quick single video analysis
npm start https://youtu.be/dQw4w9WgXcQ

# With 50 comments
npm start https://youtu.be/dQw4w9WgXcQ --comments 50

# Interactive mode for multiple videos
npm start

# Direct node execution
node src/youtube-analyzer.js https://youtu.be/dQw4w9WgXcQ --comments 30
```

### Output

The tool generates markdown files in the `outputs/` directory with the following format:
- `competitor-1.md`
- `competitor-2.md`
- `competitor-3.md`
- etc.

Each file contains:
- Video link and title
- Full description
- Keywords/tags
- Statistics (views, likes, comments, publish date, channel)
- Top relevant comments with engagement metrics (customizable count)
- Video transcript (when available)

## Example Output

See `outputs/competitor-1.md` and `outputs/competitor-2.md` for example outputs.

## API Key Setup

### Getting a YouTube API Key

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key to your `.env` file

### API Quota

The YouTube Data API has a daily quota limit. Each video analysis uses approximately:
- 1 quota unit for video info
- 1 quota unit for comments (if available)
- Transcript fetching doesn't use API quota

Default daily quota: 10,000 units (enough for ~5,000 video analyses)

## Project Structure

```
yt-video-extractor/
├── src/
│   └── youtube-analyzer.js      # Main extraction script
├── outputs/                      # Generated markdown files
│   ├── competitor-1.md
│   └── competitor-2.md
├── .env.example                  # API key template
├── .gitignore                    # Git ignore rules
├── README.md                     # This file
└── package.json                  # Project configuration
```

## Security Notes

- **Never commit your `.env` file** - It contains your API key
- The `.gitignore` file is configured to exclude `.env` automatically
- Always use `.env.example` as a template for sharing configuration

## Troubleshooting

### Transcript Not Available
Some videos don't have automatic captions or have them disabled. The tool will gracefully handle this and provide instructions for manual transcript extraction.

### Comments Disabled
If comments are disabled on a video, the tool will note this in the output.

### API Key Errors
- Ensure your API key is correctly set in `.env`
- Verify the YouTube Data API v3 is enabled in your Google Cloud project
- Check your API quota hasn't been exceeded

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Acknowledgments

- Uses [youtube-captions-scraper](https://www.npmjs.com/package/youtube-captions-scraper) for transcript extraction
- YouTube Data API v3 for video metadata and comments

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
