from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    officer_id = Column(String(100), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    password_hash = Column(String(256), nullable=False)
    precinct = Column(String(100), nullable=True)
    role = Column(String(50), default="officer", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
