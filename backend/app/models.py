from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class Scripture(Base):
    __tablename__ = "scriptures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    language = Column(String(50), default="Sanskrit")
    total_chapters = Column(Integer, default=0)
    poster_image = Column(String(255), nullable=True)

    chapters = relationship("Chapter", back_populates="scripture", cascade="all, delete-orphan")

    @property
    def poster_url(self) -> str:
        poster_name = self.poster_image or f"{self.slug}.jpg"
        return f"/api/posters/{poster_name}"


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    scripture_id = Column(Integer, ForeignKey("scriptures.id"), nullable=False)
    chapter_number = Column(Integer, nullable=False)
    title = Column(String(300), nullable=False)
    title_hindi = Column(String(300), nullable=True)
    total_verses = Column(Integer, default=0)

    scripture = relationship("Scripture", back_populates="chapters")
    verses = relationship("Verse", back_populates="chapter", cascade="all, delete-orphan")


class Verse(Base):
    __tablename__ = "verses"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    verse_number = Column(Integer, nullable=False)
    original_text = Column(Text, nullable=False)
    transliteration = Column(Text, nullable=True)
    hindi_meaning = Column(Text, nullable=False)
    scripture_audio_url = Column(String(500), nullable=True)
    meaning_audio_url = Column(String(500), nullable=True)

    chapter = relationship("Chapter", back_populates="verses")
