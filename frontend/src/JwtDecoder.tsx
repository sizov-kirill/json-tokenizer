import { useState, useEffect } from "react";
import { Highlight } from "./Highlight";
import type { SplitProps } from "./App";

function decodeJwt(token: string) {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("expected 3 parts separated by '.'");
  const decode = (s: string) => {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=");
    return JSON.parse(atob(padded));
  };
  return { header: decode(parts[0]), payload: decode(parts[1]), signature: parts[2] };
}

function expiryLabel(payload: Record<string, unknown>): string | null {
  const exp = payload.exp;
  if (typeof exp !== "number") return null;
  const diff = exp * 1000 - Date.now();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor(abs / 3600000);
  const mins = Math.floor(abs / 60000);
  const label = days > 0 ? `${days}d` : hours > 0 ? `${hours}h` : `${mins}m`;
  return diff > 0 ? `valid, expires in ${label}` : `expired ${label} ago`;
}

function Section({ title, data, searchQuery, extra }: { title: string; data: object; searchQuery: string; extra?: string }) {
  const lines = JSON.stringify(data, null, 2).split("\n");
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 16, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)" }}>{title}</span>
        {extra && <span style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>{extra}</span>}
      </div>
      <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, paddingTop: 10 }}>
        {lines.map((line, i) => <div key={i}><Highlight text={line} query={searchQuery} /></div>)}
      </pre>
    </div>
  );
}

export function JwtDecoder({ searchQuery, split, onDividerMouseDown }: { searchQuery: string } & SplitProps) {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<{ header: object; payload: Record<string, unknown>; signature: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input.trim()) { setDecoded(null); setError(null); return; }
    try {
      setDecoded(decodeJwt(input));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setDecoded(null);
    }
  }, [input]);

  const divider = <div onMouseDown={onDividerMouseDown} style={{ flexShrink: 0, width: 5, cursor: "col-resize", borderLeft: "1px solid var(--border)" }} />;

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <div style={{ width: `${split}%`, display: "flex", flexDirection: "column", padding: "20px 28px", gap: 14 }}>
        <span style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.08em" }}>auto-decodes on input</span>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste JWT here"
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
        {decoded && (
          <>
            <Section title="header" data={decoded.header} searchQuery={searchQuery} />
            <Section title="payload" data={decoded.payload} searchQuery={searchQuery} extra={expiryLabel(decoded.payload) ?? undefined} />
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>signature</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, paddingTop: 10, wordBreak: "break-all", color: "var(--muted)" }}>
                <Highlight text={decoded.signature} query={searchQuery} />
              </div>
            </div>
          </>
        )}
        {!decoded && !error && (
          <div style={{ color: "var(--muted)", paddingTop: 80, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Paste JWT to decode
          </div>
        )}
      </div>
    </div>
  );
}
