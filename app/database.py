from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# create_engine binds to settings.DATABASE_URL
# pool_pre_ping=True helps handle database connection dropouts automatically
engine = create_engine(
    settings.DATABASE_URL, 
    pool_size=10, 
    max_overflow=20, 
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency injection helper for endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
