"""Built-in, provider-independent video studio.

Creates simple social/book-trailer MP4s locally with FFmpeg. No HeyGen account,
API key, or paid video provider is required. This intentionally focuses on a
reliable baseline renderer; external AI image/voice providers can be added later
as optional adapters without becoming a hard dependency.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask

router = APIRouter(prefix="/video", tags=["video-studio"])


class Scene(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    seconds: float = Field(default=3.0, ge=1.0, le=12.0)


class RenderRequest(BaseModel):
    title: str = Field(default="Mansa Musa AI", max_length=120)
    scenes: list[Scene] = Field(min_length=1, max_length=20)
    aspect: str = Field(default="portrait", pattern="^(portrait|landscape|square)$")
    fps: int = Field(default=30, ge=20, le=60)


PRESETS = {
    "the-poisoned-tree": {
        "title": "The Poisoned Tree — The Hidden Crown",
        "aspect": "portrait",
        "scenes": [
            {"text": "THE POISONED TREE", "seconds": 2.3},
            {"text": "THE HIDDEN CROWN", "seconds": 2.0},
            {"text": "Some truths are buried. Others are hidden in plain sight.", "seconds": 4.0},
            {"text": "Ancient power. Secret societies. Artificial intelligence.", "seconds": 4.0},
            {"text": "One question changes everything: who benefits from the story you were given?", "seconds": 4.6},
            {"text": "A fictional conspiracy thriller by Askia Keita", "seconds": 3.4},
            {"text": "THE POISONED TREE — Read it now", "seconds": 3.0},
        ],
    }
}


@router.get("/status")
def video_status():
    return {
        "ok": True,
        "engine": "ffmpeg",
        "ffmpeg_available": bool(shutil.which("ffmpeg")),
        "paid_provider_required": False,
        "presets": sorted(PRESETS),
    }


@router.get("/presets/{name}")
def get_preset(name: str):
    preset = PRESETS.get(name)
    if not preset:
        raise HTTPException(status_code=404, detail="unknown video preset")
    return preset


def _cleanup(path: str):
    try:
        parent = Path(path).parent
        if parent.name.startswith("mansa-video-"):
            shutil.rmtree(parent, ignore_errors=True)
        else:
            Path(path).unlink(missing_ok=True)
    except Exception:
        pass


def _dimensions(aspect: str) -> tuple[int, int]:
    if aspect == "landscape":
        return 1920, 1080
    if aspect == "square":
        return 1080, 1080
    return 1080, 1920


@router.post("/render")
def render_video(req: RenderRequest):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise HTTPException(status_code=503, detail="FFmpeg is not installed in this deployment")

    width, height = _dimensions(req.aspect)
    work = Path(tempfile.mkdtemp(prefix="mansa-video-"))
    out = work / "mansa-musa-video.mp4"
    font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

    inputs: list[str] = []
    filters: list[str] = []
    concat_labels: list[str] = []

    for i, scene in enumerate(req.scenes):
        txt = work / f"scene-{i}.txt"
        txt.write_text(scene.text, encoding="utf-8")
        inputs += ["-f", "lavfi", "-t", str(scene.seconds), "-i",
                   f"color=c=0x0e0c0a:s={width}x{height}:r={req.fps}"]
        label = f"v{i}"
        safe_txt = str(txt).replace("'", "\\'")
        filters.append(
            f"[{i}:v]drawtext=fontfile={font}:textfile='{safe_txt}':"
            f"fontcolor=white:fontsize={max(42, width//18)}:line_spacing=18:"
            f"x=(w-text_w)/2:y=(h-text_h)/2:"
            f"box=1:boxcolor=black@0.35:boxborderw=28,"
            f"fade=t=in:st=0:d=0.35,fade=t=out:st={max(0.5, scene.seconds-0.45)}:d=0.45[{label}]"
        )
        concat_labels.append(f"[{label}]")

    filters.append("".join(concat_labels) + f"concat=n={len(req.scenes)}:v=1:a=0[outv]")
    cmd = [ffmpeg, "-y", *inputs, "-filter_complex", ";".join(filters),
           "-map", "[outv]", "-c:v", "libx264", "-pix_fmt", "yuv420p",
           "-movflags", "+faststart", str(out)]

    try:
        completed = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   text=True, timeout=180)
        if completed.returncode != 0 or not out.exists():
            detail = completed.stderr[-2500:] if completed.stderr else "unknown ffmpeg error"
            raise HTTPException(status_code=500, detail=f"Video render failed: {detail}")
    except subprocess.TimeoutExpired:
        _cleanup(str(out))
        raise HTTPException(status_code=504, detail="Video render timed out")

    filename = "the-poisoned-tree-trailer.mp4" if req.title.lower().startswith("the poisoned tree") else "mansa-musa-video.mp4"
    return FileResponse(
        str(out), media_type="video/mp4", filename=filename,
        background=BackgroundTask(_cleanup, str(out)),
    )
