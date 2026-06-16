import { useState, useCallback, KeyboardEvent } from "react";

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

function tokenColor(pct: number): string {
  if (pct >= 40) return "#ef4444";
  if (pct >= 20) return "#f97316";
  if (pct >= 10) return "#eab308";
  return "#6366f1";
}

function Bar({ pct }: { pct: number }) {
  return (
    <div style={{ flex: 1, background: "var(--surface2)", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.max(pct, 0.5)}%`,
          height: "100%",
          background: tokenColor(pct),
          borderRadius: 4,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

function DepthSection({ depth, nodes, total }: { depth: string; nodes: KeyNode[]; total: number }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: 16, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "var(--surface)",
          border: "none",
          color: "var(--text)",
          padding: "10px 16px",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span style={{ opacity: 0.4, fontSize: 11, transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", display: "inline-block" }}>▶</span>
        <span style={{ color: "var(--accent)" }}>depth {depth}</span>
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontWeight: 400 }}>{nodes.length} keys</span>
      </button>

      {open && (
        <div style={{ background: "var(--surface)" }}>
          {/* header row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 3fr 80px 60px",
            gap: 12,
            padding: "6px 16px",
            color: "var(--muted)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            borderBottom: "1px solid var(--border)",
          }}>
            <span>key</span>
            <span>path</span>
            <span style={{ textAlign: "right" }}>tokens</span>
            <span style={{ textAlign: "right" }}>%</span>
          </div>

          {nodes.map((n) => (
            <div
              key={n.path}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 3fr 80px 60px",
                gap: 12,
                padding: "7px 16px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <span style={{ fontFamily: "monospace", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={n.key}>
                {n.key}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bar pct={n.pct} />
              </span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: tokenColor(n.pct), fontWeight: 600 }}>
                {n.tokens.toLocaleString()}
              </span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>
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
      {/* header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--surface)",
      }}>
        <span style={{ fontSize: 20 }}>🔢</span>
        <span style={{ fontWeight: 700, fontSize: 16 }}>JSON Token Analyzer</span>
        <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 4 }}>cl100k_base · gpt-4 compatible</span>
      </header>

      {/* body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>

        {/* left: input */}
        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 20, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ color: "var(--muted)", fontSize: 12 }}>Max depth</label>
            {[2, 3, 4, 5, 6].map(d => (
              <button
                key={d}
                onClick={() => setMaxDepth(d)}
                style={{
                  padding: "2px 10px",
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: maxDepth === d ? "var(--accent)" : "var(--border)",
                  background: maxDepth === d ? "var(--accent-dim)" : "transparent",
                  color: maxDepth === d ? "var(--accent)" : "var(--muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  transition: "all 0.1s",
                }}
              >
                {d}
              </button>
            ))}
            <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 12 }}>⌘↵ to analyze</span>
          </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your JSON here…"
            spellCheck={false}
            style={{
              flex: 1,
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text)",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.6,
              padding: 16,
              resize: "none",
              outline: "none",
              minHeight: 400,
            }}
          />

          <button
            onClick={analyze}
            disabled={loading || !input.trim()}
            style={{
              background: loading ? "var(--accent-dim)" : "var(--accent)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: loading ? "wait" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 0",
              opacity: !input.trim() ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Analyzing…" : "Analyze tokens"}
          </button>
        </div>

        {/* right: results */}
        <div style={{ padding: 20, overflowY: "auto" }}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 8,
              color: "#fca5a5",
              padding: "12px 16px",
              marginBottom: 16,
              fontFamily: "monospace",
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {result && (
            <>
              {/* summary */}
              <div style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                  {result.total_tokens.toLocaleString()}
                </span>
                <span style={{ color: "var(--muted)" }}>total tokens</span>
              </div>

              {depths.map(d => (
                <DepthSection
                  key={d}
                  depth={d}
                  nodes={result.depths[d]}
                  total={result.total_tokens}
                />
              ))}
            </>
          )}

          {!result && !error && (
            <div style={{ color: "var(--muted)", textAlign: "center", paddingTop: 80 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <div>Paste JSON and click Analyze</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Token counts use cl100k_base (GPT-4 / Claude compatible)</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
