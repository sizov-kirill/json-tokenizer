import { useState, useEffect, useRef, useCallback } from "react";
import { Tokenizer } from "./Tokenizer";
import { Prettifier } from "./Prettifier";
import { JwtDecoder } from "./JwtDecoder";
import { Video } from "./VideoToGif";

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
  }, []);

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

        <button
          onClick={() => setDark(d => !d)}
          style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: 0 }}
        >
          {dark ? "light" : "dark"}
        </button>
      </header>

      {activeTool === "tokenizer" && <Tokenizer searchQuery={searchQuery} {...splitProps} />}
      {activeTool === "prettifier" && <Prettifier searchQuery={searchQuery} {...splitProps} />}
      {activeTool === "jwt" && <JwtDecoder searchQuery={searchQuery} {...splitProps} />}
      {activeTool === "video" && <Video {...splitProps} />}
    </div>
  );
}
