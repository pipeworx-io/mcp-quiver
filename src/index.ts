interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Quiver Quantitative MCP — alternative-data on public companies (quiverquant.com)
 *
 * Tools:
 * - quiver_congress_trading: recent US Congress stock trades (optionally by ticker)
 * - quiver_gov_contracts:    US government contracts awarded (optionally by ticker)
 * - quiver_lobbying:         corporate lobbying disclosures for a ticker
 * - quiver_insiders:         SEC insider (Form 4) transactions for a ticker
 *
 * Auth: BYO key. Pass _apiKey (your Quiver API token) — sent as
 * `Authorization: Bearer <key>`. Some endpoints require the Trader tier.
 * Hobbyist plan starts at $30/mo at quiverquant.com.
 *
 * Quiver's JSON keys are PascalCase but casing has drifted historically, so
 * every field is null-defaulted and each tool returns a `raw` first-row sample
 * so the real key names are visible for later refinement.
 */


const BASE_URL = 'https://api.quiverquant.com';

const tools: McpToolExport['tools'] = [
  {
    name: 'quiver_congress_trading',
    description:
      'Recent US Congress stock trades — who in Congress bought/sold what, with amount ranges and disclosure dates. Pass a ticker to get the trade history for that company instead ("Congress trades for TSLA"). Example: quiver_congress_trading({ ticker: "NVDA", _apiKey: "your-key" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ticker: {
          type: 'string',
          description: 'Optional stock ticker to filter to one company, e.g. "NVDA". Omit for the latest cross-market feed.',
        },
        _apiKey: {
          type: 'string',
          description: 'Quiver Quantitative API key (get one at quiverquant.com; Hobbyist plan from $30/mo)',
        },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'quiver_gov_contracts',
    description:
      'Government contracts awarded (by ticker) — US federal contract awards to public companies, with award amount, agency, and date. Pass a ticker for that company\'s contract history ("government contracts for LMT"). Example: quiver_gov_contracts({ ticker: "LMT", _apiKey: "your-key" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ticker: {
          type: 'string',
          description: 'Optional stock ticker to filter to one company, e.g. "LMT". Omit for the latest cross-market feed.',
        },
        _apiKey: {
          type: 'string',
          description: 'Quiver Quantitative API key',
        },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'quiver_lobbying',
    description:
      'Corporate lobbying disclosures for <ticker> — federal lobbying spend filed by a public company, with client, amount, date, and issue. Example: quiver_lobbying({ ticker: "GOOGL", _apiKey: "your-key" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker to look up lobbying for, e.g. "GOOGL" (required)',
        },
        _apiKey: {
          type: 'string',
          description: 'Quiver Quantitative API key',
        },
      },
      required: ['ticker', '_apiKey'],
    },
  },
  {
    name: 'quiver_insiders',
    description:
      'SEC insider (Form 4) transactions for <ticker> — corporate insider buys/sells at a public company, with insider name, share count, and date. Example: quiver_insiders({ ticker: "AAPL", _apiKey: "your-key" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker to look up insider transactions for, e.g. "AAPL" (required)',
        },
        _apiKey: {
          type: 'string',
          description: 'Quiver Quantitative API key',
        },
      },
      required: ['ticker', '_apiKey'],
    },
  },
];

// Shared GET helper. Quiver auth is a Bearer token; some endpoints are gated to
// the Trader tier and return 401/403 for lower plans.
async function quiverGet(path: string, apiKey: string, tool: string): Promise<Array<Record<string, unknown>>> {
  if (!apiKey) {
    throw new Error(
      `Quiver ${tool} requires an API key. Pass _apiKey — your Quiver Quantitative token (sign up at quiverquant.com; Hobbyist plan from $30/mo). This is a paid data source: bring your own key.`,
    );
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `Quiver ${tool}: auth failed (HTTP ${res.status}). Check your Quiver _apiKey (Trader tier may be required for this endpoint).`,
    );
  }
  if (!res.ok) {
    throw new Error(`Quiver ${tool} error: HTTP ${res.status}`);
  }
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
}

// Case-tolerant field getter — Quiver keys are PascalCase but have drifted.
// Tries the given keys in order, returns null when none present.
function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }
  return null;
}

const CAP = 100;

async function congressTrading(args: Record<string, unknown>, apiKey: string) {
  const ticker = (args.ticker as string | undefined)?.trim();
  const path = ticker
    ? `/beta/historical/congresstrading/${encodeURIComponent(ticker.toUpperCase())}`
    : '/beta/live/congresstrading';
  const rows = await quiverGet(path, apiKey, 'quiver_congress_trading');
  return {
    ticker: ticker ? ticker.toUpperCase() : null,
    count: rows.length,
    raw: rows[0] ?? null,
    trades: rows.slice(0, CAP).map((r) => ({
      representative: pick(r, 'Representative'),
      ticker: pick(r, 'Ticker'),
      transaction: pick(r, 'Transaction'),
      amount: pick(r, 'Range', 'Amount'),
      trade_date: pick(r, 'TransactionDate'),
      report_date: pick(r, 'ReportDate'),
      house: pick(r, 'House'),
    })),
  };
}

async function govContracts(args: Record<string, unknown>, apiKey: string) {
  const ticker = (args.ticker as string | undefined)?.trim();
  const path = ticker
    ? `/beta/historical/govcontractsall/${encodeURIComponent(ticker.toUpperCase())}`
    : '/beta/live/governmentcontracts';
  const rows = await quiverGet(path, apiKey, 'quiver_gov_contracts');
  return {
    ticker: ticker ? ticker.toUpperCase() : null,
    count: rows.length,
    raw: rows[0] ?? null,
    contracts: rows.slice(0, CAP).map((r) => ({
      ticker: pick(r, 'Ticker'),
      amount: pick(r, 'Amount'),
      agency: pick(r, 'Agency'),
      date: pick(r, 'Date'),
    })),
  };
}

async function lobbying(args: Record<string, unknown>, apiKey: string) {
  const ticker = (args.ticker as string | undefined)?.trim();
  if (!ticker) {
    throw new Error('quiver_lobbying requires a `ticker` (e.g. "GOOGL").');
  }
  const path = `/beta/historical/lobbying/${encodeURIComponent(ticker.toUpperCase())}`;
  const rows = await quiverGet(path, apiKey, 'quiver_lobbying');
  return {
    ticker: ticker.toUpperCase(),
    count: rows.length,
    raw: rows[0] ?? null,
    lobbying: rows.slice(0, CAP).map((r) => ({
      ticker: pick(r, 'Ticker') ?? ticker.toUpperCase(),
      client: pick(r, 'Client'),
      amount: pick(r, 'Amount'),
      date: pick(r, 'Date'),
      issue: pick(r, 'Issue'),
    })),
  };
}

async function insiders(args: Record<string, unknown>, apiKey: string) {
  const ticker = (args.ticker as string | undefined)?.trim();
  if (!ticker) {
    throw new Error('quiver_insiders requires a `ticker` (e.g. "AAPL").');
  }
  const path = `/beta/historical/insiders/${encodeURIComponent(ticker.toUpperCase())}`;
  const rows = await quiverGet(path, apiKey, 'quiver_insiders');
  return {
    ticker: ticker.toUpperCase(),
    count: rows.length,
    raw: rows[0] ?? null,
    transactions: rows.slice(0, CAP).map((r) => ({
      ticker: pick(r, 'Ticker') ?? ticker.toUpperCase(),
      name: pick(r, 'Name'),
      transaction: pick(r, 'TransactionCode', 'AcquiredDisposedCode'),
      shares: pick(r, 'Shares'),
      date: pick(r, 'Date'),
    })),
  };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  switch (name) {
    case 'quiver_congress_trading':
      return congressTrading(args, apiKey);
    case 'quiver_gov_contracts':
      return govContracts(args, apiKey);
    case 'quiver_lobbying':
      return lobbying(args, apiKey);
    case 'quiver_insiders':
      return insiders(args, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
