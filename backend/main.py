import json
from typing import Any

import tiktoken
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="JSON Token Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_encoding = tiktoken.get_encoding("cl100k_base")


def count_tokens(obj: Any) -> int:
    return len(_encoding.encode(json.dumps(obj, ensure_ascii=False, separators=(",", ":"))))


def walk(data: Any, path: str, key: str, depth: int, max_depth: int) -> list[dict]:
    nodes = [{"path": path, "key": key, "depth": depth, "tokens": count_tokens(data)}]

    if depth >= max_depth:
        return nodes

    if isinstance(data, dict):
        for k, v in data.items():
            child_path = f"{path}.{k}" if path else str(k)
            nodes.extend(walk(v, child_path, str(k), depth + 1, max_depth))
    elif isinstance(data, list):
        for i, item in enumerate(data):
            child_path = f"{path}[{i}]"
            nodes.extend(walk(item, child_path, child_path, depth + 1, max_depth))

    return nodes


class AnalyzeRequest(BaseModel):
    json_str: str
    max_depth: int = 5


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    try:
        data = json.loads(req.json_str)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    if req.max_depth < 1 or req.max_depth > 10:
        raise HTTPException(status_code=400, detail="max_depth must be between 1 and 10")

    total_tokens = count_tokens(data)

    # collect nodes starting at depth 1
    all_nodes: list[dict] = []
    if isinstance(data, dict):
        for k, v in data.items():
            all_nodes.extend(walk(v, str(k), str(k), 1, req.max_depth))
    elif isinstance(data, list):
        for i, item in enumerate(data):
            child_path = f"[{i}]"
            all_nodes.extend(walk(item, child_path, child_path, 1, req.max_depth))
    else:
        # scalar at root
        all_nodes = [{"path": "<root>", "key": "<root>", "depth": 1, "tokens": total_tokens}]

    # group by depth, sort each group by tokens desc
    by_depth: dict[int, list] = {}
    for node in all_nodes:
        d = node["depth"]
        by_depth.setdefault(d, []).append(
            {
                "key": node["key"],
                "path": node["path"],
                "tokens": node["tokens"],
                "pct": round(node["tokens"] / total_tokens * 100, 1) if total_tokens else 0,
            }
        )

    for d in by_depth:
        by_depth[d].sort(key=lambda x: x["tokens"], reverse=True)

    return {"total_tokens": total_tokens, "depths": by_depth}


@app.get("/health")
def health():
    return {"ok": True}
