# Apple Doc MCP

A Model Context Protocol (MCP) server that provides seamless access to Apple's Developer Documentation directly within your AI coding assistant.

## 🚀 Features

- **🔍 Smart Search**: Find symbols across all Apple frameworks with wildcard support (`*`, `?`)
- **📚 Framework Browsing**: Explore any Apple framework structure (SwiftUI, UIKit, Foundation, etc.)
- **📖 Detailed Documentation**: Get comprehensive symbol documentation with examples
- **🎯 Advanced Filtering**: Filter by platform (iOS, macOS, etc.), symbol type, or framework
- **⚡ Real-time Data**: Always up-to-date with Apple's latest documentation
- **🧠 AI-Optimized**: Clean markdown output perfect for AI assistants

## 📦 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/MightyDillah/apple-doc-mcp.git
   cd apple-doc-mcp
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

## 🔌 Quick Setup

### Step 1: Configure Your AI Assistant

**Claude Desktop**: Edit `~/.config/claude/claude_desktop_config.json`
**Cursor**: Settings (`Cmd/Ctrl + ,`) → Extensions → MCP
**Continue.dev**: Edit `~/.continue/config.json`
**VS Code (Claude)**: Settings → MCP Servers

```json
{
  "mcpServers": {
    "apple-doc-mcp": {
      "command": "node",
      "args": ["/path/to/apple-doc-mcp/dist/index.js"]
    }
  }
}
```
*Replace `/path/to/apple-doc-mcp` with the actual path to your cloned repository.*

### Step 2: Restart & Test
1. Restart your AI assistant
2. Try: "List available Apple technologies"
3. You should see 4 new tools available

## 🎯 How to Use

Once configured, just talk naturally to your AI assistant. Here are examples:

### Browse Available Technologies
```
"Use apple-doc-mcp to list all current Apple frameworks"
"Get the latest available Apple technologies from Apple's docs"
"Search Apple documentation for all available frameworks"
```

### Explore a Framework
```
"Use apple-doc-mcp to browse SwiftUI framework structure"
"Get current UIKit topics from Apple documentation"
"Search Apple docs for Foundation framework details"
```

### Search for Specific APIs
```
"Search Apple's SwiftUI docs for drag and drop APIs"
"Use apple-doc-mcp to find RPBroadcast* classes in ReplayKit"
"Look up current *View* symbols across Apple frameworks"
"Find all *Controller classes in UIKit using Apple docs"
```

### Get Detailed Documentation
```
"Get the latest SwiftUI View protocol docs from Apple"
"Use apple-doc-mcp to look up UIViewController documentation"
"Search Apple's current docs for NSURLSession details"
```

The AI will automatically use the MCP tools to fetch current Apple documentation and provide comprehensive answers.

## 🛠️ Available Tools

### `list_technologies`
Browse all available Apple frameworks and technologies.

### `browse_framework`
Explore the structure and topics of a specific framework.
- `framework` (required): Framework name (e.g., "SwiftUI", "UIKit")

### `search_symbols`
Search for symbols across Apple frameworks with advanced filtering.
- `query` (required): Search query with wildcard support
- `framework` (optional): Search within specific framework
- `symbolType` (optional): Filter by symbol type (class, protocol, struct, etc.)
- `platform` (optional): Filter by platform (iOS, macOS, etc.)
- `maxResults` (optional): Maximum results (default: 20)

**Examples**:
```json
{"query": "RPBroadcast*"}
{"query": "*Controller", "framework": "UIKit"}
{"query": "*View*", "platform": "iOS", "maxResults": 5}
```

### `get_symbol`
Get detailed documentation for a specific symbol.
- `path` (required): Documentation path (e.g., "documentation/SwiftUI/View")

## 🚨 Troubleshooting

**Server Won't Start**
- Ensure Node.js 18+ is installed
- For direct usage: Verify the path in your MCP config points to the correct `dist/index.js` location

- Check your MCP configuration syntax
- Restart your AI assistant after config changes

**"0 tools" Showing Up**
- This usually means the server isn't starting properly
- Check the file path in your configuration is correct and absolute
- Make sure you've run `npm run build` to create the `dist` directory
- Try testing the server directly: `node /path/to/apple-doc-mcp/dist/index.js`

**No Results Found**
- Try broader search terms
- Use wildcard patterns: `"*View*"` instead of `"View"`
- Remove filters to expand search scope

**Performance Issues**
- First search may be slower (builds cache)
- Subsequent searches are much faster
- Reduce `maxResults` for faster responses

## ⚙️ Technical Details

- **10-minute caching** to avoid API rate limits
- **15-second timeouts** for reliable performance
- **Smart framework prioritization** for faster searches
- **Graceful error handling** for robust operation

## 📋 Requirements

- **Node.js**: 18.0.0 or higher
- **Memory**: ~50MB RAM during operation
- **Network**: Internet connection to Apple's documentation API

## 🤝 Contributing

Found a bug or want to add a feature? Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.