import { useState, useCallback, useEffect } from "react";
import { Highlight } from "./Highlight";
import type { SplitProps } from "./App";

interface KeyNode {
  key: string;
  path?: string;
  tokens: number;
  pct: number;
}

interface AnalyzeResult {
  total_tokens: number;
  is_json: boolean;
  depths: Record<string, KeyNode[]>;
  by_key: KeyNode[];
}

const API = import.meta.env.VITE_API_URL ?? "";

function Bar({ pct }: { pct: number }) {
  return (
    <div style={{ flex: 1, background: "var(--border)", height: 1 }}>
      <div style={{ width: `${Math.max(pct, 0.5)}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s ease" }} />
    </div>
  );
}

function Row({ n, searchQuery }: { n: KeyNode; searchQuery: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 72px 52px", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        <Highlight text={n.key} query={searchQuery} />
      </span>
      <span style={{ display: "flex", alignItems: "center" }}><Bar pct={n.pct} /></span>
      <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13 }}>{n.tokens.toLocaleString()}</span>
      <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13 }}>{n.pct}%</span>
    </div>
  );
}

function TableHeader() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 72px 52px", gap: 12, padding: "6px 0", color: "var(--muted)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", borderBottom: "1px solid var(--border)" }}>
      <span>key</span><span /><span style={{ textAlign: "right" }}>tokens</span><span style={{ textAlign: "right" }}>%</span>
    </div>
  );
}

function DepthSection({ depth, nodes, searchQuery }: { depth: string; nodes: KeyNode[]; searchQuery: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", background: "none", border: "none", color: "var(--muted)", padding: "14px 0", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}
      >
        <span>depth {depth}</span>
        <span style={{ marginLeft: "auto" }}>{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 8 }}>
          <TableHeader />
          {nodes.map(n => <Row key={n.path} n={n} searchQuery={searchQuery} />)}
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
          properties: { query: { type: "string", description: "The search query" } },
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

export function Tokenizer({ searchQuery, split, onDividerMouseDown }: { searchQuery: string } & SplitProps) {
  const [input, setInput] = useState(EXAMPLE);
  const [maxDepth, setMaxDepth] = useState(5);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"depth" | "key">("depth");

  const run = useCallback(async (depth: number) => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json_str: input, max_depth: depth }),
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
  }, [input]);

  const analyze = useCallback(() => run(maxDepth), [run, maxDepth]);

  const deeper = useCallback(() => {
    const next = maxDepth + 1;
    setMaxDepth(next);
    run(next);
  }, [run, maxDepth]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [analyze]);

  const depths = result ? Object.keys(result.depths).sort((a, b) => Number(a) - Number(b)) : [];

  const divider = <div onMouseDown={onDividerMouseDown} style={{ flexShrink: 0, width: 5, cursor: "col-resize", borderLeft: "1px solid var(--border)" }} />;

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <div style={{ width: `${split}%`, display: "flex", flexDirection: "column", padding: "20px 28px", gap: 14 }}>
        <span style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.08em" }}>⌘↵ to analyze</span>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste JSON here"
          spellCheck={false}
          style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, padding: 16, resize: "none", outline: "none", minHeight: 400 }}
        />
      </div>

      {divider}

      <div style={{ flex: 1, padding: "20px 28px", overflowY: "auto" }}>
        {error && (
          <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "12px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
            {error}
          </div>
        )}

        {result && (
          <>
            <div style={{ padding: "20px 0 24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {result.total_tokens.toLocaleString()}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 8 }}>
                  {result.is_json ? "total tokens" : "total tokens · plain text"}
                </div>
              </div>
              {result.is_json && (
                <div style={{ display: "flex", gap: 16, paddingBottom: 2 }}>
                  {(["depth", "key"] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)} style={{ background: "none", border: "none", color: mode === m ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 10, fontWeight: mode === m ? 700 : 400, letterSpacing: "0.15em", textTransform: "uppercase", padding: 0 }}>
                      {m === "depth" ? "by depth" : "by key"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!result.is_json && (
              <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
                Input isn’t valid JSON — showing the raw token count only.
              </div>
            )}

            {result.is_json && mode === "depth" && (
              <>
                {depths.map(d => <DepthSection key={d} depth={d} nodes={result.depths[d]} searchQuery={searchQuery} />)}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 4 }}>
                  <button onClick={deeper} disabled={loading} style={{ background: "none", border: "none", color: loading ? "var(--muted)" : "var(--accent)", cursor: loading ? "wait" : "pointer", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: 0 }}>
                    {loading ? "loading" : `deeper (${maxDepth} → ${maxDepth + 1})`}
                  </button>
                </div>
              </>
            )}

            {result.is_json && mode === "key" && (
              <div>
                <TableHeader />
                {result.by_key.map(n => <Row key={n.key} n={n} searchQuery={searchQuery} />)}
              </div>
            )}
          </>
        )}

        {!result && !error && (
          <div style={{ color: "var(--muted)", paddingTop: 80, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Paste JSON and analyze
          </div>
        )}
      </div>
    </div>
  );
}
