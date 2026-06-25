import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";

const API = import.meta.env.VITE_API_URL ?? "";
const SAVE_DELAY = 800;

export function Markdown() {
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch(`${API}/markdown`)
      .then(r => r.json())
      .then(d => setContent(d.content ?? ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!preview) textareaRef.current?.focus();
  }, [preview]);

  useEffect(() => {
    return () => clearTimeout(saveTimer.current);
  }, []);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.altKey && !e.metaKey && !e.ctrlKey && e.code === "KeyP") {
        e.preventDefault();
        setPreview(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const persist = useCallback((text: string) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`${API}/markdown`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
      } finally {
        setSaving(false);
      }
    }, SAVE_DELAY);
  }, []);

  const handleChange = (text: string) => {
    setContent(text);
    persist(text);
  };

  const tab = (active: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    borderBottom: `1px solid ${active ? "var(--accent)" : "transparent"}`,
    color: active ? "var(--accent)" : "var(--muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 10,
    fontWeight: active ? 700 : 400,
    height: "100%",
    letterSpacing: "0.15em",
    padding: 0,
    textTransform: "uppercase",
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "stretch",
        gap: 20,
        height: 40,
        padding: "0 28px",
      }}>
        <button onClick={() => setPreview(false)} style={tab(!preview)}>edit</button>
        <button onClick={() => setPreview(true)} style={tab(preview)}>
          preview <span style={{ opacity: 0.4 }}>⌥P</span>
        </button>
        {saving && (
          <span style={{
            alignSelf: "center",
            color: "var(--muted)",
            fontSize: 9,
            letterSpacing: "0.1em",
            marginLeft: "auto",
            textTransform: "uppercase",
          }}>
            saving
          </span>
        )}
      </div>

      {!preview && (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder="write markdown here…"
          spellCheck={false}
          style={{
            flex: 1,
            background: "var(--bg)",
            border: "none",
            color: "var(--text)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            lineHeight: 1.75,
            outline: "none",
            padding: "28px",
            resize: "none",
          }}
        />
      )}

      {preview && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {content ? (
            <div
              className="md"
              dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }}
              style={{ maxWidth: 800, margin: "0 auto", padding: "40px 28px" }}
            />
          ) : (
            <div style={{
              color: "var(--muted)",
              fontSize: 10,
              letterSpacing: "0.15em",
              paddingTop: 80,
              textAlign: "center",
              textTransform: "uppercase",
            }}>
              nothing to preview
            </div>
          )}
        </div>
      )}
    </div>
  );
}
