export interface Verse {
  id: number;
  verse_number: number;
  original_text: string;
  transliteration: string | null;
  hindi_meaning: string;
  scripture_audio_url: string | null;
  meaning_audio_url: string | null;
}

export interface Chapter {
  id: number;
  chapter_number: number;
  title: string;
  title_hindi: string | null;
  total_verses: number;
}

export interface ChapterDetail extends Chapter {
  verses: Verse[];
}

export interface Scripture {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  language: string;
  total_chapters: number;
  poster_image?: string | null;
  poster_url: string | null;
}

export interface ScriptureDetail extends Scripture {
  chapters: Chapter[];
}

export interface PaginatedVerses {
  items: Verse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
