import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Scripture, Chapter, Verse
from ..schemas import (
    ScriptureBrief,
    ScriptureDetail,
    ChapterBrief,
    ChapterDetail,
    PaginatedVerses,
    VerseOut,
)

router = APIRouter(prefix="/api/scriptures", tags=["scriptures"])


@router.get("/", response_model=list[ScriptureBrief])
async def list_scriptures(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scripture).order_by(Scripture.name))
    return result.scalars().all()


@router.get("/{slug}", response_model=ScriptureDetail)
async def get_scripture(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Scripture)
        .where(Scripture.slug == slug)
        .options(selectinload(Scripture.chapters))
    )
    scripture = result.scalar_one_or_none()
    if not scripture:
        raise HTTPException(status_code=404, detail="Scripture not found")
    return scripture


@router.get("/{slug}/chapters", response_model=list[ChapterBrief])
async def list_chapters(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scripture).where(Scripture.slug == slug))
    scripture = result.scalar_one_or_none()
    if not scripture:
        raise HTTPException(status_code=404, detail="Scripture not found")

    chapters = await db.execute(
        select(Chapter)
        .where(Chapter.scripture_id == scripture.id)
        .order_by(Chapter.chapter_number)
    )
    return chapters.scalars().all()


@router.get("/{slug}/chapters/{chapter_num}", response_model=ChapterDetail)
async def get_chapter(slug: str, chapter_num: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scripture).where(Scripture.slug == slug))
    scripture = result.scalar_one_or_none()
    if not scripture:
        raise HTTPException(status_code=404, detail="Scripture not found")

    chapter_result = await db.execute(
        select(Chapter)
        .where(Chapter.scripture_id == scripture.id, Chapter.chapter_number == chapter_num)
        .options(selectinload(Chapter.verses))
    )
    chapter = chapter_result.scalar_one_or_none()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter


@router.get("/{slug}/chapters/{chapter_num}/verses", response_model=PaginatedVerses)
async def list_verses(
    slug: str,
    chapter_num: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Scripture).where(Scripture.slug == slug))
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

    total_result = await db.execute(
        select(func.count()).select_from(Verse).where(Verse.chapter_id == chapter.id)
    )
    total = total_result.scalar()

    offset = (page - 1) * per_page
    verses_result = await db.execute(
        select(Verse)
        .where(Verse.chapter_id == chapter.id)
        .order_by(Verse.verse_number)
        .offset(offset)
        .limit(per_page)
    )

    return PaginatedVerses(
        items=verses_result.scalars().all(),
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page),
    )


@router.get("/{slug}/chapters/{chapter_num}/verses/{verse_num}", response_model=VerseOut)
async def get_verse(
    slug: str,
    chapter_num: int,
    verse_num: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Scripture).where(Scripture.slug == slug))
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
    verse = verse_result.scalar_one_or_none()
    if not verse:
        raise HTTPException(status_code=404, detail="Verse not found")
    return verse
