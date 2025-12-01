from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "user"
    preferred_language: str = "vi"
    avatar_url: Optional[str] = None
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"  # "user" / "caregiver" / "admin"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2: cho phép đọc từ ORM
