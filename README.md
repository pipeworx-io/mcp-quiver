# mcp-quiver

Quiver Quantitative MCP — alternative-data on public companies (quiverquant.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/quiver/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Quiver data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
