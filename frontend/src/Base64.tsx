import { useState, useEffect, useRef } from "react";
import type { SplitProps } from "./App";

type Mode = "encode" | "decode";

function process(input: string, mode: Mode): { output: string; error: string | null } {
  if (!input.trim()) return { output: "", error: null };
  try {
    if (mode === "encode") {
      const bytes = new TextEncoder().encode(input);
      const binary = Array.from(bytes, b => String.fromCharCode(b)).join("");
      return { output: btoa(binary), error: null };
    } else {
      const binary = atob(input.trim());
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      return { output: new TextDecoder().decode(bytes), error: null };
    }
  } catch {
    return { output: "", error: `invalid input for ${mode}` };
  }
}

export function Base64({ split, onDividerMouseDown }: SplitProps) {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const { output, error } = process(input, mode);
  const divider = <div onMouseDown={onDividerMouseDown} style={{ flexShrink: 0, width: 5, cursor: "col-resize", borderLeft: "1px solid var(--border)" }} />;

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <div style={{ width: `${split}%`, display: "flex", flexDirection: "column", padding: "20px 28px", gap: 14 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {(["encode", "decode"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ background: "none", border: "none", color: mode === m ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 10, fontWeight: mode === m ? 700 : 400, letterSpacing: "0.15em", textTransform: "uppercase", padding: 0 }}>
              {m}
            </button>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === "encode" ? "text to encode" : "base64 to decode"}
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
          <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {output}
          </pre>
        )}
        {!output && !error && (
          <div style={{ color: "var(--muted)", paddingTop: 80, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {mode === "encode" ? "type text to encode" : "paste base64 to decode"}
          </div>
        )}
      </div>
    </div>
  );
}
