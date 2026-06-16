from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    officer_id: str = Field(..., example="8092-BLR")
    name: str = Field(..., example="Officer Patil")
    password: str = Field(..., example="password123")
    precinct: Optional[str] = Field(None, example="IND-BLR-SOUTH")
    role: Optional[str] = Field("officer", example="officer")

class UserLogin(BaseModel):
    officer_id: str = Field(..., example="8092-BLR")
    password: str = Field(..., example="password123")

class UserResponse(BaseModel):
    officer_id: str
    name: str
    precinct: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    status: str
    message: str
    user: Optional[UserResponse] = None
    token: Optional[str] = None
