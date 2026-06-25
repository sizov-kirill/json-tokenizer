import { useState, useRef, useCallback, useEffect, DragEvent } from "react";
import type { SplitProps } from "./App";

const API = import.meta.env.VITE_API_URL ?? "";

type OutputFormat = "video" | "gif";

function NumInput({ label, value, onChange, min, max, step, unit, placeholder }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string; placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", minWidth: 52 }}>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step ?? 1}
        value={value || ""}
        placeholder={placeholder ?? ""}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 60, background: "none", border: "none", borderBottom: "1px solid var(--border)", color: "var(--text)", fontFamily: "inherit", fontSize: 13, outline: "none", padding: "2px 0", textAlign: "center" }}
      />
      {unit && <span style={{ color: "var(--muted)", fontSize: 10 }}>{unit}</span>}
    </div>
  );
}

export function Video({ split, onDividerMouseDown }: SplitProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("video");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [fps, setFps] = useState(0);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputMime, setOutputMime] = useState<OutputFormat>("video");
  const [outputSize, setOutputSize] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (outputUrl) URL.revokeObjectURL(outputUrl); };
  }, [outputUrl]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === "o") {
        e.preventDefault();
        inputRef.current?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const accept = (f: File) => {
    if (!f.type.startsWith("video/")) { setError("not a video file"); return; }
    setFile(f);
    setOutputUrl(null);
    setError(null);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) accept(f);
  };

  const run = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("output_format", outputFormat);
      form.append("start", String(start));
      form.append("end", String(end));
      form.append("speed", String(speed));
      form.append("fps", String(fps));
      form.append("width", String(width));

      const res = await fetch(`${API}/convert`, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "conversion failed" }));
        throw new Error(data.detail);
      }
      const blob = await res.blob();
      setOutputUrl(URL.createObjectURL(blob));
      setOutputMime(outputFormat);
      setOutputSize(blob.size);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [file, outputFormat, start, end, speed, fps, width]);

  const fmt = (bytes: number) => bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;

  const divider = <div onMouseDown={onDividerMouseDown} style={{ flexShrink: 0, width: 5, cursor: "col-resize", borderLeft: "1px solid var(--border)" }} />;

  return (
    <div style={{ flex: 1, display: "flex" }}>
      <div style={{ width: `${split}%`, display: "flex", flexDirection: "column", padding: "20px 28px", gap: 20 }}>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
            padding: "48px 20px",
            textAlign: "center",
            cursor: "pointer",
            color: dragOver ? "var(--accent)" : "var(--muted)",
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          {file
            ? <><div style={{ color: "var(--text)", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{file.name}</div><div>{fmt(file.size)}</div></>
            : <div>drop video or click to select <span style={{ opacity: 0.4 }}>o</span></div>
          }
          <input ref={inputRef} type="file" accept="video/*" onChange={e => e.target.files?.[0] && accept(e.target.files[0])} style={{ display: "none" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>output</span>
            {(["video", "gif"] as const).map(f => (
              <button key={f} onClick={() => setOutputFormat(f)} style={{ background: "none", border: "none", color: outputFormat === f ? "var(--accent)" : "var(--muted)", cursor: "pointer", fontSize: 10, fontWeight: outputFormat === f ? 700 : 400, letterSpacing: "0.15em", textTransform: "uppercase", padding: 0 }}>
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <NumInput label="start" value={start} onChange={setStart} min={0} max={9999} unit="s" placeholder="0" />
            <NumInput label="end" value={end} onChange={setEnd} min={0} max={9999} unit="s" placeholder="full" />
            <NumInput label="speed" value={speed} onChange={setSpeed} min={0.25} max={16} step={0.25} unit="×" placeholder="1" />
            {outputFormat === "gif" && (
              <NumInput label="fps" value={fps} onChange={setFps} min={1} max={60} placeholder="10" />
            )}
            <NumInput label="width" value={width} onChange={setWidth} min={100} max={1920} unit="px" placeholder="orig" />
          </div>
        </div>

        <button
          onClick={run}
          disabled={!file || loading}
          style={{
            background: "var(--accent)",
            border: "none",
            color: "var(--bg)",
            cursor: !file || loading ? "not-allowed" : "pointer",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "13px 0",
            opacity: !file ? 0.3 : 1,
            transition: "opacity 0.15s",
            marginTop: "auto",
          }}
        >
          {loading ? "processing…" : outputFormat === "gif" ? "convert to gif" : "process video"}
        </button>
      </div>

      {divider}

      <div style={{ flex: 1, padding: "20px 28px", overflowY: "auto" }}>
        {error && (
          <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "12px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 20, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {error}
          </div>
        )}

        {outputUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ color: "var(--muted)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{fmt(outputSize)}</span>
              <a href={outputUrl} download={outputMime === "gif" ? "output.gif" : "output.mp4"} style={{ color: "var(--accent)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                download
              </a>
            </div>
            {outputMime === "gif"
              ? <img src={outputUrl} alt="output" style={{ maxWidth: "100%", border: "1px solid var(--border)" }} />
              : <video src={outputUrl} controls autoPlay loop muted style={{ maxWidth: "100%", border: "1px solid var(--border)" }} />
            }
          </div>
        )}

        {!outputUrl && !error && (
          <div style={{ color: "var(--muted)", paddingTop: 80, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {loading ? "processing, this may take a moment…" : "select a video to get started"}
          </div>
        )}
      </div>
    </div>
  );
}
