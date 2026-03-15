from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from config import settings
from models.base import Base
import logging

logger = logging.getLogger(__name__)

# Async PostgreSQL engine
# Ensure the database URL uses the async driver if it doesn't already
db_url = settings.database_url
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    db_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        # Import all models to ensure they are registered with Base
        import models.customer
        import models.conversation
        import models.message
        import models.ticket
        import models.knowledge_base
        import models.channel_config
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables ready")

async def get_db() -> AsyncSession:
    """Dependency for routes."""
    async with async_session() as session:
        yield session
