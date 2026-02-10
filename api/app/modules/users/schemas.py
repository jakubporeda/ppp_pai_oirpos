from pydantic import BaseModel
from typing import Optional, List

# --- NOWOŚĆ: SCHEMATY ADRESÓW ---
class UserAddressBase(BaseModel):
    name: str
    city: str
    street: str
    number: str

class UserAddressCreate(UserAddressBase):
    pass

class UserAddressOut(UserAddressBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- SCHEMATY UŻYTKOWNIKA (Bez zmian w logice) ---

class UserBase(BaseModel):
    email: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    phone_number: str
    street: str
    city: str
    postal_code: str
    terms_accepted: bool
    marketing_consent: bool
    data_processing_consent: bool

class UserOut(UserBase):
    id: int
    first_name: str
    last_name: str
    role: str
    street: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    
    # NOWOŚĆ: Lista adresów
    additional_addresses: List[UserAddressOut] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(UserBase):
    id: int
    first_name: str
    last_name: str
    role: str
    role_request: Optional[str] = None
    ...



    
