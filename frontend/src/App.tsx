import { useState, useEffect, useRef, useCallback } from "react";
import { Tokenizer } from "./Tokenizer";
import { Prettifier } from "./Prettifier";
import { JwtDecoder } from "./JwtDecoder";
import { Video } from "./VideoToGif";

const SHORTCUTS = [
  { group: "tools",   keys: "1 / 2 / 3 / 4",  desc: "switch tool" },
  { group: "panels",  keys: "[ / ]",            desc: "resize panels" },
  { group: "search",  keys: "⌘F",               desc: "focus search" },
  { group: "search",  keys: "Escape",            desc: "clear search" },
  { group: "tokens",  keys: "⌘↵",               desc: "analyze JSON" },
  { group: "video",   keys: "o",                 desc: "open file picker" },
  { group: "general", keys: "?",                 desc: "toggle help" },
];

function Help({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "32px 40px", minWidth: 360 }}
      >
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 24, color: "var(--muted)" }}>shortcuts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {SHORTCUTS.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--accent)" }}>{s.keys}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{s.desc}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.5 }}>
          press ? or click outside to close
        </div>
      </div>
    </div>
  );
}

const TOOLS = [
  { id: "tokenizer", label: "JSON Tokens", key: "1" },
  { id: "prettifier", label: "Prettifier", key: "2" },
  { id: "jwt", label: "JWT", key: "3" },
  { id: "video", label: "Video", key: "4" },
] as const;

type ToolId = "tokenizer" | "prettifier" | "jwt" | "video";

export interface SplitProps {
  split: number;
  onDividerMouseDown: (e: React.MouseEvent) => void;
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [activeTool, setActiveTool] = useState<ToolId>("tokenizer");
  const [searchQuery, setSearchQuery] = useState("");
  const [split, setSplit] = useState(50);
  const [showHelp, setShowHelp] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (e: MouseEvent) => {
      const pct = (e.clientX / window.innerWidth) * 100;
      setSplit(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "TEXTAREA" || tag === "INPUT";

      if (!inInput && e.key === "?") { setShowHelp(v => !v); return; }
      if (e.key === "Escape" && showHelp) { setShowHelp(false); return; }
      if (!inInput && !e.metaKey && !e.ctrlKey && !e.altKey && ["1", "2", "3", "4"].includes(e.key)) {
        setActiveTool(TOOLS[parseInt(e.key) - 1].id);
        setSearchQuery("");
      }
      if (!inInput && e.key === "[") setSplit(s => Math.max(20, s - 5));
      if (!inInput && e.key === "]") setSplit(s => Math.min(80, s + 5));
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape" && !inInput) {
        setSearchQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showHelp]);

  const splitProps: SplitProps = { split, onDividerMouseDown };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid var(--border)", padding: "0 28px", display: "flex", alignItems: "stretch", background: "var(--surface)", height: 44 }}>
        <nav style={{ display: "flex", alignItems: "stretch", gap: 0, marginRight: 24 }}>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setSearchQuery(""); }}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTool === t.id ? "1px solid var(--accent)" : "1px solid transparent",
                color: activeTool === t.id ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                fontSize: 10,
                fontWeight: activeTool === t.id ? 700 : 400,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "0 16px 0 0",
                marginRight: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {t.label}
              <span style={{ opacity: 0.4, fontSize: 9 }}>{t.key}</span>
            </button>
          ))}
        </nav>

        <input
          ref={searchRef}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Escape" && (setSearchQuery(""), (e.target as HTMLInputElement).blur())}
          placeholder="search  ⌘F"
          style={{
            background: "none",
            border: "none",
            borderBottom: searchQuery ? "1px solid var(--accent)" : "1px solid transparent",
            color: "var(--text)",
            fontFamily: "inherit",
            fontSize: 10,
            letterSpacing: "0.08em",
            outline: "none",
            padding: 0,
            width: 160,
            alignSelf: "center",
          }}
        />

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={() => setShowHelp(v => !v)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: 0 }}>
            ?
          </button>
          <button onClick={() => setDark(d => !d)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: 0 }}>
            {dark ? "light" : "dark"}
          </button>
        </div>
      </header>

      {showHelp && <Help onClose={() => setShowHelp(false)} />}

      {activeTool === "tokenizer" && <Tokenizer searchQuery={searchQuery} {...splitProps} />}
      {activeTool === "prettifier" && <Prettifier searchQuery={searchQuery} {...splitProps} />}
      {activeTool === "jwt" && <JwtDecoder searchQuery={searchQuery} {...splitProps} />}
      {activeTool === "video" && <Video {...splitProps} />}
    </div>
  );
}
