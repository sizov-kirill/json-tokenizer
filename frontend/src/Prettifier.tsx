import { useState, useEffect, useRef } from "react";
import { Highlight } from "./Highlight";
import type { SplitProps } from "./App";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12 };
const MUTED: React.CSSProperties = { color: "var(--muted)" };

function JsonNode({ value, query, isLast }: { value: unknown; query: string; isLast: boolean }) {
  const [open, setOpen] = useState(true);

  const comma = !isLast ? <span style={MUTED}>,</span> : null;

  if (value === null) return <><span style={MUTED}>null</span>{comma}</>;
  if (typeof value === "boolean") return <><span><Highlight text={String(value)} query={query} /></span>{comma}</>;
  if (typeof value === "number") return <><span><Highlight text={String(value)} query={query} /></span>{comma}</>;
  if (typeof value === "string") return <><span><Highlight text={JSON.stringify(value)} query={query} /></span>{comma}</>;

  const isArray = Array.isArray(value);
  const entries: [string, unknown][] = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>);
  const [ob, cb] = isArray ? ["[", "]"] : ["{", "}"];

  if (entries.length === 0) return <><span style={MUTED}>{ob}{cb}</span>{comma}</>;

  const toggle = (
    <span
      onClick={() => setOpen(v => !v)}
      style={{ cursor: "pointer", userSelect: "none", color: "var(--muted)", marginRight: 2 }}
    >
      {open ? "▾" : "▸"}
    </span>
  );

  if (!open) {
    return (
      <>
        {toggle}
        <span
          onClick={() => setOpen(true)}
          style={{ cursor: "pointer", color: "var(--muted)" }}
        >
          {ob}{isArray ? `${entries.length}` : "…"}{cb}
        </span>
        {comma}
      </>
    );
  }

  return (
    <>
      {toggle}<span style={MUTED}>{ob}</span>
      <div style={{ paddingLeft: 20 }}>
        {entries.map(([k, v], i) => (
          <div key={k} style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
            {!isArray && (
              <span style={MUTED}>
                <Highlight text={`"${k}"`} query={query} />
                <span style={{ marginRight: 4 }}>:</span>
              </span>
            )}
            <JsonNode value={v} query={query} isLast={i === entries.length - 1} />
          </div>
        ))}
      </div>
      <span style={MUTED}>{cb}</span>{comma}
    </>
  );
}

export function Prettifier({ searchQuery, split, onDividerMouseDown }: { searchQuery: string } & SplitProps) {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    if (!input.trim()) { setParsed(null); setError(null); return; }
    try {
      const first = JSON.parse(input);
      // auto-unwrap double-encoded JSON strings
      const value = typeof first === "string" ? (() => { try { return JSON.parse(first); } catch { return first; } })() : first;
      setParsed(value);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setParsed(null);
    }
  }, [input]);

  const divider = <div onMouseDown={onDividerMouseDown} style={{ flexShrink: 0, width: 5, cursor: "col-resize", borderLeft: "1px solid var(--border)" }} />;

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <div style={{ width: `${split}%`, display: "flex", flexDirection: "column", padding: "20px 28px", gap: 14 }}>
        <span style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.08em" }}>auto-formats on input</span>
        <textarea
          ref={textareaRef}
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
        {parsed !== null && (
          <div style={{ ...MONO, lineHeight: 1.8 }}>
            <JsonNode value={parsed} query={searchQuery} isLast={true} />
          </div>
        )}
        {parsed === null && !error && (
          <div style={{ color: "var(--muted)", paddingTop: 80, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Paste JSON to prettify
          </div>
        )}
      </div>
    </div>
  );
}
