from pydantic import BaseModel, ConfigDict, field_validator


class VerseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    verse_number: int
    original_text: str
    transliteration: str | None = None
    hindi_meaning: str
    scripture_audio_url: str | None = None
    meaning_audio_url: str | None = None

    @field_validator("scripture_audio_url", "meaning_audio_url", mode="before")
    @classmethod
    def normalize_audio_url(cls, value: str | None) -> str | None:
        if isinstance(value, str) and value.startswith("/audio/"):
            return f"/api{value}"
        return value


class ChapterBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chapter_number: int
    title: str
    title_hindi: str | None = None
    total_verses: int


class ChapterDetail(ChapterBrief):
    verses: list[VerseOut] = []


class ScriptureBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None = None
    language: str
    total_chapters: int
    poster_image: str | None = None
    poster_url: str | None = None


class ScriptureDetail(ScriptureBrief):
    chapters: list[ChapterBrief] = []


class PaginatedVerses(BaseModel):
    items: list[VerseOut]
    total: int
    page: int
    per_page: int
    total_pages: int
