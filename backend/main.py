import json
import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from models import AnalyzeRequest
from use_cases.analyze_json import analyze_json
from use_cases.convert_video import convert_video

app = FastAPI(title="zootoolz")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    if not 1 <= req.max_depth <= 10:
        raise HTTPException(400, "max_depth must be between 1 and 10")
    try:
        data = json.loads(req.json_str)
    except json.JSONDecodeError as e:
        raise HTTPException(400, f"Invalid JSON: {e}")
    return analyze_json(data, req.max_depth)


@app.post("/convert")
async def convert(
    file: UploadFile = File(...),
    output_format: str = Form("video"),
    start: float = Form(0.0),
    end: float = Form(0.0),
    speed: float = Form(1.0),
    fps: int = Form(0),
    width: int = Form(0),
):
    if output_format not in ("video", "gif"):
        raise HTTPException(400, "output_format must be 'video' or 'gif'")
    if not 0.25 <= speed <= 16:
        raise HTTPException(400, "speed must be between 0.25 and 16")
    if fps != 0 and not 1 <= fps <= 60:
        raise HTTPException(400, "fps must be between 1 and 60")
    if width != 0 and not 100 <= width <= 1920:
        raise HTTPException(400, "width must be between 100 and 1920")
    if end > 0 and end <= start:
        raise HTTPException(400, "end must be greater than start")

    content = await file.read()
    if len(content) > 500 * 1024 * 1024:
        raise HTTPException(400, "file too large (max 500MB)")

    ext = os.path.splitext(file.filename or "")[1] or ".mp4"

    try:
        data = convert_video(content, ext, output_format, start, end, speed, fps, width)
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    media_type = "image/gif" if output_format == "gif" else "video/mp4"
    filename = "output.gif" if output_format == "gif" else "output.mp4"
    return Response(content=data, media_type=media_type, headers={"Content-Disposition": f"attachment; filename={filename}"})


@app.get("/health")
def health():
    return {"ok": True}
