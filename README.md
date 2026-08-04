# mcp-quiver

Quiver Quantitative MCP — alternative-data on public companies (quiverquant.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `quiver_congress_trading` | Recent US Congress stock trades — who in Congress bought/sold what, with amount ranges and disclosure dates. Pass a ticker to get the trade history for that company instead ("Congress trades for TSLA"). Example: quiver_congress_trading({ ticker: "NVDA", _apiKey: "your-key" }) |
| `quiver_gov_contracts` | Government contracts awarded (by ticker) — US federal contract awards to public companies, with award amount, agency, and date. Pass a ticker for that company's contract history ("government contracts for LMT"). Example: quiver_gov_contracts({ ticker: "LMT", _apiKey: "your-key" }) |
| `quiver_lobbying` | Corporate lobbying disclosures for <ticker> — federal lobbying spend filed by a public company, with client, amount, date, and issue. Example: quiver_lobbying({ ticker: "GOOGL", _apiKey: "your-key" }) |
| `quiver_insiders` | SEC insider (Form 4) transactions for <ticker> — corporate insider buys/sells at a public company, with insider name, share count, and date. Example: quiver_insiders({ ticker: "AAPL", _apiKey: "your-key" }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "quiver": {
      "url": "https://gateway.pipeworx.io/quiver/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Quiver data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
