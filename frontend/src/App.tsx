import { useState, useCallback, useEffect, KeyboardEvent } from "react";

interface KeyNode {
  key: string;
  path: string;
  tokens: number;
  pct: number;
}

interface AnalyzeResult {
  total_tokens: number;
  depths: Record<string, KeyNode[]>;
}

const API = import.meta.env.VITE_API_URL ?? "";

function Bar({ pct }: { pct: number }) {
  return (
    <div style={{ flex: 1, background: "var(--border)", height: 1 }}>
      <div style={{ width: `${Math.max(pct, 0.5)}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease" }} />
    </div>
  );
}

function DepthSection({ depth, nodes }: { depth: string; nodes: KeyNode[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          color: "var(--muted)",
          padding: "14px 0",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        <span>depth {depth}</span>
        <span style={{ marginLeft: "auto" }}>{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div style={{ paddingBottom: 8 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 3fr 72px 52px",
            gap: 12,
            padding: "6px 0",
            color: "var(--muted)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            borderBottom: "1px solid var(--border)",
          }}>
            <span>key</span>
            <span></span>
            <span style={{ textAlign: "right" }}>tokens</span>
            <span style={{ textAlign: "right" }}>%</span>
          </div>

          {nodes.map((n) => (
            <div
              key={n.path}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 3fr 72px 52px",
                gap: 12,
                padding: "9px 0",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: "monospace", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {n.key}
              </span>
              <span style={{ display: "flex", alignItems: "center" }}>
                <Bar pct={n.pct} />
              </span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13 }}>
                {n.tokens.toLocaleString()}
              </span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)", fontSize: 12 }}>
                {n.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EXAMPLE = JSON.stringify(
  {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What tools do you have?" },
    ],
    tools: [
      {
        name: "search",
        description: "Search the web for information. Use this tool when the user asks about recent events or needs factual information you may not have.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query" },
          },
          required: ["query"],
        },
      },
    ],
    model: "gpt-4o",
    temperature: 0.7,
  },
  null,
  2
);

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const [input, setInput] = useState(EXAMPLE);
  const [maxDepth, setMaxDepth] = useState(4);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json_str: input, max_depth: maxDepth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Unknown error");
      setResult(data);
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [input, maxDepth]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze();
  };

  const depths = result ? Object.keys(result.depths).sort((a, b) => Number(a) - Number(b)) : [];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        background: "var(--surface)",
      }}>
        <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          JSON Token Analyzer
        </span>
        <span style={{ color: "var(--muted)", fontSize: 10, marginLeft: 20, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          cl100k_base
        </span>
        <button
          onClick={() => setDark(d => !d)}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: 0,
          }}
        >
          {dark ? "light" : "dark"}
        </button>
      </header>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "20px 28px", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>Depth</span>
            <input
              type="number"
              min={1}
              max={10}
              value={maxDepth}
              onChange={e => setMaxDepth(Math.min(10, Math.max(1, Number(e.target.value))))}
              style={{
                width: 36,
                background: "none",
                border: "none",
                borderBottom: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                padding: "1px 0",
                textAlign: "center",
              }}
            />
            <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 10, letterSpacing: "0.08em" }}>⌘↵</span>
          </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste JSON here"
            spellCheck={false}
            style={{
              flex: 1,
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.7,
              padding: 16,
              resize: "none",
              outline: "none",
              minHeight: 400,
            }}
          />
        </div>

        <div style={{ padding: "20px 28px", overflowY: "auto" }}>
          {error && (
            <div style={{
              color: "var(--muted)",
              fontFamily: "monospace",
              fontSize: 11,
              padding: "12px 0",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {result && (
            <>
              <div style={{ padding: "20px 0 28px" }}>
                <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {result.total_tokens.toLocaleString()}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 8 }}>
                  total tokens
                </div>
              </div>

              {depths.map(d => (
                <DepthSection key={d} depth={d} nodes={result.depths[d]} />
              ))}
            </>
          )}

          {!result && !error && (
            <div style={{ color: "var(--muted)", paddingTop: 80, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Paste JSON and analyze
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
