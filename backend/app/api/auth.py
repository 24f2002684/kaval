from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token, decode_access_token, oauth2_scheme
from backend.app.models.models import User
from backend.app.schemas.schemas import Token, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

class DemoSwitchRequest(BaseModel):
    role: str  # 'admin', 'officer', 'responder', 'citizen'

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=user.email, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        full_name=user.full_name,
        email=user.email,
        household_id=user.household_id
    )

@router.post("/demo-switch", response_model=Token)
def demo_switch(switch_req: DemoSwitchRequest, db: Session = Depends(get_db)):
    """
    Hackathon rapid role-switcher for judges to test the app seamlessly across all 4 roles.
    """
    role_email_map = {
        "admin": "admin@kaval.gov.in",
        "officer": "officer@kaval.gov.in",
        "responder": "responder@kaval.gov.in",
        "citizen": "citizen@kaval.gov.in"
    }
    target_email = role_email_map.get(switch_req.role.lower())
    if not target_email:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found")
        
    token = create_access_token(subject=user.email, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        full_name=user.full_name,
        email=user.email,
        household_id=user.household_id
    )

@router.get("/me", response_model=UserResponse)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
