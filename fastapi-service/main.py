# FastAPI Service for text extraction
# Images: Groq vision (default) or Tesseract when installed (ara+eng)

import asyncio
import base64
import os
import tempfile
from io import BytesIO
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from groq import Groq
from PIL import Image

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

# Print which file is being loaded
print(f"Loading FastAPI service from: {__file__}")

# Create FastAPI app instance
app = FastAPI(
    title="FastAPI Service",
    description="A FastAPI service for processing various tasks",
    version="1.0.0"
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    print("[OK] GET /health endpoint called")
    return {"status": "ok"}

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
