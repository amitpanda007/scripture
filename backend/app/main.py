from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from gtts import gTTS

from .database import init_db, get_db
from .models import Scripture, Chapter, Verse
from .routes.scriptures import router as scripture_router

AUDIO_DIR = Path(__file__).resolve().parent.parent / "audio"
POSTER_DIR = Path(__file__).resolve().parent.parent / "posters"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Scripture API",
    description="API for ancient scripture texts with audio playback",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5200","http://127.0.0.1:5200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/audio/{scripture_slug}/{chapter_num}/{filename}")
async def get_audio_file(
    scripture_slug: str,
    chapter_num: int,
    filename: str,
    db: AsyncSession = Depends(get_db),
    x_scripture_app_audio: str | None = Header(None)
):
    if x_scripture_app_audio != "true":
        raise HTTPException(status_code=403, detail="Direct download not permitted")

    parts = filename.split("_")
    if len(parts) != 2:
        raise HTTPException(status_code=404, detail="Invalid filename")
    
    verse_num_str, audio_type = parts[0], parts[1].replace(".mp3", "")
    try:
        verse_num = int(verse_num_str)
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid verse number")

    file_path = AUDIO_DIR / scripture_slug / str(chapter_num) / filename
    
    if file_path.exists():
        return FileResponse(file_path)

    result = await db.execute(select(Scripture).where(Scripture.slug == scripture_slug))
    scripture = result.scalar_one_or_none()
    if not scripture:
        raise HTTPException(status_code=404, detail="Scripture not found")

    chapter_result = await db.execute(
        select(Chapter).where(
            Chapter.scripture_id == scripture.id,
            Chapter.chapter_number == chapter_num,
        )
    )
    chapter = chapter_result.scalar_one_or_none()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    verse_result = await db.execute(
        select(Verse).where(
            Verse.chapter_id == chapter.id,
            Verse.verse_number == verse_num,
        )
    )
    verse_obj = verse_result.scalar_one_or_none()
    if not verse_obj:
        raise HTTPException(status_code=404, detail="Verse not found")

    text = ""
    lang = "hi"
    if audio_type == "verse":
        text = verse_obj.original_text
    elif audio_type == "meaning":
        text = verse_obj.hindi_meaning
    else:
        raise HTTPException(status_code=404, detail="Invalid audio type")

    if not text:
        raise HTTPException(status_code=404, detail="Text not available")

    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    tts = gTTS(text=text, lang=lang)
    tts.save(str(file_path))
    
    return FileResponse(file_path)

app.mount("/api/posters", StaticFiles(directory=str(POSTER_DIR)), name="posters")
app.include_router(scripture_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
