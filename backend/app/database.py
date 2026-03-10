from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = "sqlite+aiosqlite:///./scripture.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Lightweight SQLite migration for poster metadata.
        result = await conn.execute(text("PRAGMA table_info(scriptures)"))
        column_names = {row[1] for row in result.fetchall()}
        if "poster_image" not in column_names:
            await conn.execute(text("ALTER TABLE scriptures ADD COLUMN poster_image VARCHAR(255)"))

        await conn.execute(
            text(
                """
                UPDATE scriptures
                SET poster_image = CASE
                    WHEN slug = 'gita' THEN 'design.jpg'
                    ELSE lower(replace(slug, ' ', '_')) || '.jpg'
                END
                WHERE poster_image IS NULL OR trim(poster_image) = ''
                """
            )
        )
