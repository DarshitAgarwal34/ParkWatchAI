import hashlib
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user_schemas import UserCreate, UserLogin, LoginResponse, UserResponse

logger = logging.getLogger("app_routes_auth")
router = APIRouter(prefix="/auth", tags=["authentication"])

def get_password_hash(password: str) -> str:
    """Computes a SHA-256 salted hash of the password."""
    salt = "parkwatch_salt_123#"
    return hashlib.sha256((password + salt).encode()).hexdigest()

def ensure_default_user(db: Session):
    """Ensures a default officer exists in the database to prevent lockout."""
    try:
        if db.query(User).count() == 0:
            logger.info("No users found in database. Seeding default officer unit '8092-BLR'...")
            default_user = User(
                officer_id="8092-BLR",
                name="Officer Patil",
                password_hash=get_password_hash("password123"),
                precinct="IND-BLR-SOUTH",
                role="officer"
            )
            db.add(default_user)
            db.commit()
            logger.info("Default officer seeded successfully.")
    except Exception as e:
        logger.error(f"Error during default user check: {e}")

@router.post("/register", response_model=LoginResponse)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Registers a new officer unit in the database system."""
    ensure_default_user(db)
    
    # Check if user already exists
    existing = db.query(User).filter(User.officer_id == payload.officer_id.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Officer ID '{payload.officer_id}' already registered."
        )
        
    new_user = User(
        officer_id=payload.officer_id.strip(),
        name=payload.name.strip(),
        password_hash=get_password_hash(payload.password),
        precinct=payload.precinct.strip() if payload.precinct else None,
        role=payload.role.strip() if payload.role else "officer"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "status": "success",
        "message": "Officer account registered successfully.",
        "user": new_user,
        "token": f"MOCK-TOKEN-{new_user.officer_id}"
    }

@router.post("/login", response_model=LoginResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticates officer credentials and returns account parameters."""
    ensure_default_user(db)
    
    user = db.query(User).filter(User.officer_id == payload.officer_id.strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Officer ID or password."
        )
        
    incoming_hash = get_password_hash(payload.password)
    if user.password_hash != incoming_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Officer ID or password."
        )
        
    return {
        "status": "success",
        "message": "Authorization granted.",
        "user": user,
        "token": f"MOCK-TOKEN-{user.officer_id}"
    }
