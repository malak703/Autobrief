# FastAPI Service for text extraction
# Images: Groq vision (default) or Tesseract when installed (ara+eng)

import asyncio
import base64
import json
import os
import re
import tempfile
from datetime import date
from io import BytesIO
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from PIL import Image
from pydantic import AliasChoices, BaseModel, Field

# Lazy-load pytesseract so a broken optional stack (e.g. bad numpy wheel) does not crash app startup.
_pytesseract_mod = None
_pytesseract_import_attempted = False


def _get_pytesseract():
    """Return pytesseract module or None if missing or unloadable."""
    global _pytesseract_mod, _pytesseract_import_attempted
    if _pytesseract_import_attempted:
        return _pytesseract_mod
    _pytesseract_import_attempted = True
    try:
        import pytesseract as pt  # noqa: PLC0415

        _pytesseract_mod = pt
    except Exception:
        _pytesseract_mod = None
    return _pytesseract_mod


# Load environment variables from .env file
load_dotenv()

WORK_FILTER_SYSTEM_PROMPT = (
    "You are a filter. Your only job is to extract work-related \n"
    "information from this conversation.\n\n"
    "KEEP: project requirements, features requested, deadlines, \n"
    "budgets, references, feedback, decisions made, anything \n"
    "about the actual work.\n\n"
    "REMOVE: greetings, jokes, personal talk, filler words, \n"
    "reactions, off-topic messages, anything not about the work.\n\n"
    "Return ONLY the extracted work content as plain bullet points. \n"
    "Do not summarize. Do not rephrase. Use their exact words."
)

PROJECT_BRIEF_SYSTEM_PROMPT = (
    "You are a professional project brief writer.\n"
    "Below is a list of extracted client requirements. \n"
    "Your very first line (before any ###) must be exactly one line in this format:\n"
    "TITLE: <short compelling headline for the client, Title Case, max 10 words, no quotation marks>\n"
    "Leave one blank line after that line, then output the structured brief.\n"
    "Turn this into a structured project brief with these \n"
    "exact 4 sections. **CRITICAL: You must separate each section with exactly '###' on its own line.**\n\n"
    "Example format:\n"
    "TITLE: Spring Campaign Refresh For Northwind\n"
    "\n"
    "###\n"
    "1. What the client wants\n"
    "(content here)\n"
    "###\n"
    "2. Goals & success criteria\n"
    "(content here)\n"
    "###\n"
    "3. Gaps & unclear points\n"
    "(content here)\n"
    "###\n"
    "4. Follow-up questions\n"
    "**CRITICAL: You must separate each individual follow-up question with exactly '@@@' on its own line.**\n"
    "(Example: Question 1\n@@@\nQuestion 2)\n\n"
    "Be specific. No generic statements. If something isn't in \n"
    "the input, don't invent it — flag it as a gap instead."
)


def _groq_api_key_or_raise() -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable is not set",
        )
    return api_key


# Print which file is being loaded
print(f"Loading FastAPI service from: {__file__}")

# Create FastAPI app instance
app = FastAPI(
    title="FastAPI Service",
    description="A FastAPI service for processing various tasks",
    version="1.0.0"
)

# Add CORS middleware to allow Next.js app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FilterWorkContentBody(BaseModel):
    """Combined extracted text from text, voice, and image endpoints."""

    text: str = Field(
        ...,
        validation_alias=AliasChoices("text", "extracted_text"),
        description="Raw combined material (e.g. joined outputs from extract-text / extract-voice / extract-image).",
    )


class ProjectBriefBody(BaseModel):
    """Filtered work bullets from POST /filter-work-content."""

    filtered_text: str = Field(
        ...,
        validation_alias=AliasChoices("filtered_text", "text"),
        description="Work-only bullet list (typically the filtered_text field from /filter-work-content).",
    )


class DeadlinesFromTextBody(BaseModel):
    """Work-only bullets (same shape as filter output) to scan for dated milestones."""

    text: str = Field(
        ...,
        validation_alias=AliasChoices("text", "filtered_text"),
        description="Filtered work-related bullet points that may mention due dates.",
    )


_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _strip_json_fences(s: str) -> str:
    s = s.strip()
    if not s.startswith("```"):
        return s
    lines = s.split("\n")
    lines = lines[1:] if lines else []
    if lines and lines[-1].strip().startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _normalize_deadline_rows(raw: list) -> List[dict]:
    out: List[dict] = []
    for item in raw[:20]:
        if not isinstance(item, dict):
            continue
        d = str(item.get("parsed_date") or item.get("date") or "").strip()
        title = str(
            item.get("extracted_text")
            or item.get("requirement")
            or item.get("deliverable")
            or item.get("title")
            or ""
        ).strip()
        if not d or not _ISO_DATE.match(d):
            continue
        if not title:
            continue
        out.append({"parsed_date": d, "extracted_text": title[:500]})
    return out


def _groq_extract_deadlines(work_bullets: str) -> List[dict]:
    """Return [{parsed_date, extracted_text}, ...] from filtered bullets; [] on parse failure."""
    api_key = _groq_api_key_or_raise()
    model = (os.getenv("GROQ_DEADLINE_MODEL") or "llama-3.3-70b-versatile").strip()
    client = Groq(api_key=api_key)
    today_iso = date.today().isoformat()
    system = (
        "You extract explicit project deadlines from work-related bullet points. "
        'Return ONLY a JSON object with a single key "deadlines" whose value is an array. '
        'Each item must have "parsed_date" (string YYYY-MM-DD) and "extracted_text". '
        "Rules for extracted_text (this becomes the calendar deadline name): "
        "It MUST be the requirement, deliverable, or submission that is due on that date — "
        "the same obligation described in the bullet (what must be submitted, delivered, or completed). "
        "Use the client's exact wording for that requirement; do not invent scope. "
        "You may remove only the date/time phrase from the string (e.g. drop 'by June 1' or 'before Friday') "
        "so the name reads as the work item, not the schedule phrase. "
        "Do not use generic titles like 'Deadline', 'Due date', or 'Milestone' alone. "
        "If you cannot name a specific requirement tied to the date, omit that item. "
        "Include only items with a clear calendar date tied to a stated deliverable or obligation. "
        "You may use Today's date only to resolve relative phrases when the YYYY-MM-DD is unambiguous; "
        "otherwise omit. "
        'If there are no such deadlines, return {"deadlines": []}. '
        "No markdown fences. No other keys."
    )
    user = f"Today's date: {today_iso}\n\nWork bullets:\n\n{work_bullets}"
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.1,
        max_tokens=2048,
    )
    raw = (completion.choices[0].message.content or "").strip()
    try:
        data = json.loads(_strip_json_fences(raw))
    except json.JSONDecodeError:
        return []
    arr = data.get("deadlines") if isinstance(data, dict) else None
    if not isinstance(arr, list):
        return []
    return _normalize_deadline_rows(arr)


@app.get("/health")
async def health_check():
    """Health check endpoint (used by Next.js /api/extract-health)."""
    print("[OK] GET /health endpoint called")
    return {
        "status": "ok",
        "service": "autobrief-fastapi-extract",
        "post_routes": [
            "/extract-voice",
            "/extract-text",
            "/extract-image",
            "/filter-work-content",
            "/filter-and-generate-brief",
            "/generate-project-brief",
            "/extract-deadlines",
            "/process-client-feedback",
        ],
    }

def _coerce_audio_content_type(upload: UploadFile) -> str:
    """Browsers and zip exports often send application/octet-stream; infer from filename."""
    allowed = {
        "audio/mpeg",
        "audio/mp3",
        "audio/mp4",
        "audio/m4a",
        "audio/ogg",
        "audio/wav",
        "audio/aac",
        "audio/webm",
        "application/octet-stream",
    }
    ct = (upload.content_type or "").strip() or "application/octet-stream"
    if ct in allowed:
        if ct != "application/octet-stream":
            return ct
    name = (upload.filename or "").lower()
    if name.endswith(".mp3"):
        return "audio/mpeg"
    if name.endswith(".m4a"):
        return "audio/mp4"
    if name.endswith(".wav"):
        return "audio/wav"
    if name.endswith(".aac"):
        return "audio/aac"
    if name.endswith(".webm"):
        return "audio/webm"
    if name.endswith(".ogg") or name.endswith(".opus"):
        return "audio/ogg"
    if ct in allowed:
        return ct
    raise HTTPException(
        status_code=400,
        detail=f"Unrecognized audio type (content_type={upload.content_type!r}, filename={upload.filename!r}).",
    )


@app.post("/extract-voice")
async def extract_text_from_voice(voice: UploadFile = File(...)):
    """
    Extract text from audio file using Groq Whisper transcription.
    
    Args:
        voice: Audio file (.mp3, .m4a, .ogg, .wav)
    
    Returns:
        JSON response with transcribed text
    """
    print("[OK] POST /extract-voice endpoint called")
    try:
        _coerce_audio_content_type(voice)
        
        # Check for Groq API key
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY environment variable is not set"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            # Read and write audio file to temp location
            audio_bytes = await voice.read()
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # Initialize Groq client
            client = Groq(api_key=groq_api_key)
            
            # Transcribe audio using Whisper
            with open(temp_file_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=(temp_file_path, audio_file.read()),
                    model="whisper-large-v3"
                    # No language specified - auto-detects Arabic, English, and mixed
                )
            
            transcript = transcription.text.strip()
            
            if not transcript:
                return {
                    "extracted_text": "[FROM VOICE]: No speech could be transcribed from the audio file."
                }
            
            return {
                "extracted_text": f"[FROM VOICE]: {transcript}"
            }
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass  # File might already be deleted
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle any other errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to transcribe audio: {str(e)}"
        )

@app.post("/extract-text")
async def extract_text_from_text(text: str = Body(...)):
    """
    Process raw pasted text content.
    
    Args:
        text: Raw text content
    
    Returns:
        JSON response with labeled text
    """
    print("[OK] POST /extract-text endpoint called")
    try:
        # No processing needed, just label it
        if not text.strip():
            return {
                "extracted_text": "[FROM TEXT]: No text provided."
            }
        
        return {
            "extracted_text": f"[FROM TEXT]: {text}"
        }
        
    except Exception as e:
        # Handle any unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process text: {str(e)}"
        )


def _groq_filter_work_bullets(raw_text: str) -> str:
    """Call Groq chat to keep only work-related lines as verbatim bullet points."""
    api_key = _groq_api_key_or_raise()
    model = (os.getenv("GROQ_FILTER_MODEL") or "llama-3.3-70b-versatile").strip()
    client = Groq(api_key=api_key)
    user_content = (
        "The following is raw material from a conversation "
        "(text, voice transcripts, and image OCR). "
        "Labels such as [FROM TEXT], [FROM VOICE], or [FROM IMAGE] may appear.\n\n"
        f"{raw_text}"
    )
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": WORK_FILTER_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.1,
        max_tokens=8192,
    )
    return (completion.choices[0].message.content or "").strip()


@app.post("/filter-work-content")
async def filter_work_content(body: FilterWorkContentBody):
    """
    Take combined extracted text (from uploads / transcripts / OCR) and return
    work-only content as bullet points via Groq (see WORK_FILTER_SYSTEM_PROMPT).

    Optional env: GROQ_FILTER_MODEL (default: llama-3.3-70b-versatile).
    """
    print("[OK] POST /filter-work-content endpoint called")
    raw = (body.text or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="No text provided.")
    try:
        filtered = await asyncio.to_thread(_groq_filter_work_bullets, raw)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to filter content: {str(e)}",
        ) from e
    return {"filtered_text": filtered}


def _groq_project_brief_from_requirements(filtered_bullets: str) -> str:
    """Turn filtered requirement bullets into the 4-section project brief."""
    api_key = _groq_api_key_or_raise()
    model = (os.getenv("GROQ_BRIEF_MODEL") or "llama-3.3-70b-versatile").strip()
    client = Groq(api_key=api_key)
    user_content = f"Extracted client requirements:\n\n{filtered_bullets}"
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": PROJECT_BRIEF_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.2,
        max_tokens=8192,
    )
    return (completion.choices[0].message.content or "").strip()


@app.post("/generate-project-brief")
async def generate_project_brief(body: ProjectBriefBody):
    """
    Input: output of /filter-work-content (work-only bullets).
    Output: structured 4-section project brief via Groq.

    Optional env: GROQ_BRIEF_MODEL (default: llama-3.3-70b-versatile).
    """
    print("[OK] POST /generate-project-brief endpoint called")
    blob = (body.filtered_text or "").strip()
    if not blob:
        raise HTTPException(status_code=400, detail="No filtered_text provided.")
    try:
        brief = await asyncio.to_thread(_groq_project_brief_from_requirements, blob)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate project brief: {str(e)}",
        ) from e
    return {"project_brief": brief}


@app.post("/filter-and-generate-brief")
async def filter_and_generate_brief(body: FilterWorkContentBody):
    """
    One call: combined raw extracted text → filter → project brief.
    Same inputs as /filter-work-content. Returns both intermediate and final text.
    """
    print("[OK] POST /filter-and-generate-brief endpoint called")
    raw = (body.text or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="No text provided.")
    try:
        filtered = await asyncio.to_thread(_groq_filter_work_bullets, raw)
        brief = await asyncio.to_thread(_groq_project_brief_from_requirements, filtered)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed pipeline: {str(e)}",
        ) from e
    return {"filtered_text": filtered, "project_brief": brief}


@app.post("/extract-deadlines")
async def extract_deadlines(body: DeadlinesFromTextBody):
    """
    Parse filtered work bullets for explicit deadlines; returns rows for the deadlines table.

    Optional env: GROQ_DEADLINE_MODEL (default: llama-3.3-70b-versatile).
    """
    print("[OK] POST /extract-deadlines endpoint called")
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided.")
    try:
        rows = await asyncio.to_thread(_groq_extract_deadlines, text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract deadlines: {str(e)}",
        ) from e
    return {"deadlines": rows}


def _tesseract_available() -> bool:
    pt = _get_pytesseract()
    if pt is None:
        return False
    try:
        pt.get_tesseract_version()
        return True
    except Exception:
        return False


def _ocr_tesseract(pil_img: Image.Image) -> str:
    pt = _get_pytesseract()
    if pt is None or not _tesseract_available():
        return ""
    for lang in ("ara+eng", "eng"):
        try:
            out = pt.image_to_string(pil_img, lang=lang).strip()
            if out:
                return out
        except Exception:
            continue
    try:
        return pt.image_to_string(pil_img).strip()
    except Exception:
        return ""


def _image_to_data_url(pil_img: Image.Image, max_b64_len: int = 4 * 1024 * 1024 - 15_000) -> str:
    """Build a data URL under Groq's ~4MB base64 limit (JPEG, progressive resize)."""
    img = pil_img.convert("RGB")
    for attempt in range(24):
        buf = BytesIO()
        quality = max(28, 92 - (attempt * 3))
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        raw = buf.getvalue()
        b64 = base64.standard_b64encode(raw).decode("ascii")
        if len(b64) <= max_b64_len:
            return f"data:image/jpeg;base64,{b64}"
        w, h = img.size
        img = img.resize(
            (max(1, int(w * 0.72)), max(1, int(h * 0.72))),
            Image.Resampling.LANCZOS,
        )
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=25, optimize=True)
    return f"data:image/jpeg;base64,{base64.standard_b64encode(buf.getvalue()).decode('ascii')}"


def _groq_vision_extract_text(pil_img: Image.Image, api_key: str, model: str) -> str:
    """Read visible text (Arabic + English) via Groq vision model."""
    data_url = _image_to_data_url(pil_img)
    client = Groq(api_key=api_key)
    prompt = (
        "Transcribe every piece of visible text in this image. "
        "Include Arabic and Latin script exactly as shown. "
        "Preserve line breaks where they help readability. "
        "If there is no readable text, respond with exactly: NONE"
    )
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        max_tokens=4096,
        temperature=0.1,
    )
    raw = (completion.choices[0].message.content or "").strip()
    if raw.upper() == "NONE" or not raw:
        return ""
    return raw


def _groq_vision_try_models(pil_img: Image.Image, api_key: str) -> str:
    """Try configured vision model, then common alternates."""
    preferred = (os.getenv("GROQ_VISION_MODEL") or "").strip()
    candidates = [
        preferred,
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-3.2-11b-vision-preview",
    ]
    seen: set[str] = set()
    for model in candidates:
        if not model or model in seen:
            continue
        seen.add(model)
        try:
            return _groq_vision_extract_text(pil_img, api_key, model)
        except Exception:
            continue
    return ""


@app.post("/extract-image")
async def extract_text_from_images(images: List[UploadFile] = File(...)):
    """
    Extract text from screenshots: Groq vision when GROQ_API_KEY is set,
    else Tesseract (ara+eng) if installed on the host.
    """
    print("[OK] POST /extract-image endpoint called")

    if not images:
        raise HTTPException(status_code=400, detail="No image files provided.")

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key and not _tesseract_available():
        raise HTTPException(
            status_code=503,
            detail=(
                "Image extraction needs GROQ_API_KEY (Groq vision, recommended) or "
                "Tesseract OCR with Arabic/English traineddata installed and on PATH."
            ),
        )

    chunks: List[str] = []

    for upload in images:
        try:
            raw = await upload.read()
        except Exception as e:
            chunks.append(f"[FROM IMAGE]: Failed to read upload: {e}")
            continue
        if not raw:
            chunks.append("[FROM IMAGE]: Empty file.")
            continue

        try:
            pil = Image.open(BytesIO(raw))
            pil.load()
        except Exception as e:
            chunks.append(f"[FROM IMAGE]: Not a valid image ({e}).")
            continue

        if pil.mode not in ("RGB", "L", "RGBA"):
            pil = pil.convert("RGBA")
        if pil.mode == "RGBA":
            rgb = Image.new("RGB", pil.size, (255, 255, 255))
            rgb.paste(pil, mask=pil.split()[3])
            pil = rgb
        elif pil.mode != "RGB":
            pil = pil.convert("RGB")

        text = ""
        if groq_key:
            text = await asyncio.to_thread(_groq_vision_try_models, pil, groq_key)

        if not text.strip() and _tesseract_available():
            text = _ocr_tesseract(pil)

        if not text.strip():
            chunks.append("[FROM IMAGE]: No text detected.")
        else:
            chunks.append(f"[FROM IMAGE]: {text.strip()}")

    return {"extracted_text": "\n\n".join(chunks)}

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
