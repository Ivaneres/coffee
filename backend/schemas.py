from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth schemas
class LoginCredentials(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User Settings schemas
class UserSettingsCreate(BaseModel):
    default_machine: Optional[str] = None
    default_grinder: Optional[str] = None

class UserSettingsResponse(BaseModel):
    id: int
    user_id: int
    default_machine: Optional[str] = None
    default_grinder: Optional[str] = None
    
    class Config:
        from_attributes = True

# Bean schemas
class BeanCreate(BaseModel):
    variety: str
    seller: Optional[str] = None
    roaster: Optional[str] = None
    roast_level: Optional[str] = None

class BeanUpdate(BaseModel):
    variety: Optional[str] = None
    seller: Optional[str] = None
    roaster: Optional[str] = None
    roast_level: Optional[str] = None

class BeanResponse(BaseModel):
    id: int
    user_id: int
    variety: str
    seller: Optional[str] = None
    roaster: Optional[str] = None
    roast_level: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Espresso Record schemas
class EspressoRecordCreate(BaseModel):
    bean_id: int
    machine: str
    grinder: str
    grind_size: Optional[str] = None
    dose: Optional[float] = None
    extraction_time: Optional[float] = None
    yield_amount: Optional[float] = None
    rating: Optional[int] = None
    sourness: Optional[int] = None
    bitterness: Optional[int] = None
    sweetness: Optional[int] = None
    notes: Optional[str] = None

class EspressoRecordUpdate(BaseModel):
    machine: Optional[str] = None
    grinder: Optional[str] = None
    grind_size: Optional[str] = None
    dose: Optional[float] = None
    extraction_time: Optional[float] = None
    yield_amount: Optional[float] = None
    rating: Optional[int] = None
    sourness: Optional[int] = None
    bitterness: Optional[int] = None
    sweetness: Optional[int] = None
    notes: Optional[str] = None

class EspressoRecordResponse(BaseModel):
    id: int
    user_id: int
    bean_id: int
    machine: str
    grinder: str
    grind_size: Optional[str] = None
    dose: Optional[float] = None
    extraction_time: Optional[float] = None
    yield_amount: Optional[float] = None
    rating: Optional[int] = None
    sourness: Optional[int] = None
    bitterness: Optional[int] = None
    sweetness: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Search schemas
class SearchParams(BaseModel):
    machine: Optional[str] = None
    grinder: Optional[str] = None
    bean_variety: Optional[str] = None
    bean_roaster: Optional[str] = None
