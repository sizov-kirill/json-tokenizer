import { useState, useEffect } from "react";
import { Highlight } from "./Highlight";
import type { SplitProps } from "./App";

export function Prettifier({ searchQuery, split, onDividerMouseDown }: { searchQuery: string } & SplitProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input.trim()) { setOutput(null); setError(null); return; }
    try {
      setOutput(JSON.stringify(JSON.parse(input), null, 2));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setOutput(null);
    }
  }, [input]);

  const lines = output?.split("\n") ?? [];

  const divider = <div onMouseDown={onDividerMouseDown} style={{ flexShrink: 0, width: 5, cursor: "col-resize", borderLeft: "1px solid var(--border)" }} />;

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <div style={{ width: `${split}%`, display: "flex", flexDirection: "column", padding: "20px 28px", gap: 14 }}>
        <span style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.08em" }}>auto-formats on input</span>
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
          <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "12px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            {error}
          </div>
        )}
        {output && (
          <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, color: "var(--text)" }}>
            {lines.map((line, i) => (
              <div key={i}><Highlight text={line} query={searchQuery} /></div>
            ))}
          </pre>
        )}
        {!output && !error && (
          <div style={{ color: "var(--muted)", paddingTop: 80, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Paste JSON to prettify
          </div>
        )}
      </div>
    </div>
  );
}
