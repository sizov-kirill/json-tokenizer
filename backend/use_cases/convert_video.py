import os
import subprocess
import tempfile


def _gif_filter(fps: int, width: int, pts: float) -> str:
    effective_fps = fps if fps > 0 else 10
    effective_width = width if width > 0 else 480
    return (
        f"fps={effective_fps},scale={effective_width}:-1:flags=lanczos,setpts={pts}*PTS[v];"
        f"[v]split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5"
    )


def _video_filter(fps: int, width: int, pts: float) -> str:
    parts = []
    if fps > 0:
        parts.append(f"fps={fps}")
    if width > 0:
        parts.append(f"scale={width}:-2:flags=lanczos")
    parts.append(f"setpts={pts}*PTS")
    return ",".join(parts)


def _build_ffmpeg_cmd(input_path: str, output_path: str, output_format: str, start: float, end: float, fps: int, width: int, pts: float) -> list[str]:
    cmd = ["ffmpeg", "-y"]
    if start > 0:
        cmd += ["-ss", str(start)]
    if end > 0:
        cmd += ["-t", str(end - start)]
    cmd += ["-i", input_path]

    if output_format == "gif":
        cmd += ["-filter_complex", _gif_filter(fps, width, pts), "-loop", "0"]
    else:
        cmd += ["-vf", _video_filter(fps, width, pts), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "23"]

    cmd.append(output_path)
    return cmd


def convert_video(content: bytes, ext: str, output_format: str, start: float, end: float, speed: float, fps: int, width: int) -> bytes:
    pts = round(1.0 / speed, 6)
    out_ext = ".gif" if output_format == "gif" else ".mp4"

    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, f"input{ext}")
        output_path = os.path.join(tmpdir, f"output{out_ext}")

        with open(input_path, "wb") as f:
            f.write(content)

        cmd = _build_ffmpeg_cmd(input_path, output_path, output_format, start, end, fps, width, pts)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            raise RuntimeError(result.stderr[-2000:])

        with open(output_path, "rb") as f:
            return f.read()
