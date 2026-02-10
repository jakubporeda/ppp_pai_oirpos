from pydantic import BaseModel
from typing import List, Optional

# --- Produkty ---
class ProductBase(BaseModel):
    name: str
    price: float
    category: str

class ProductCreate(ProductBase):
    restaurant_id: int

class ProductOut(ProductBase):
    id: int
    restaurant_id: int
    class Config:
        from_attributes = True

class Product(ProductBase):
    id: int
    class Config:
        from_attributes = True

# --- Pomocniczy schemat właściciela ---
class OwnerInfo(BaseModel):
    first_name: str
    last_name: str
    email: str
    class Config:
        from_attributes = True

# --- Restauracje ---
class RestaurantBase(BaseModel):
    name: str
    cuisines: str
    city: str
    street: str
    number: str
    description: Optional[str] = None

class RestaurantCreate(RestaurantBase):
    rating: Optional[float] = 0.0

# --- EDYCJA DANYCH RESTAURACJI (Brakujący element) ---
class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    cuisines: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    rating: Optional[float] = None
    description: Optional[str] = None

# --- AKTUALIZACJA STATUSU ---
class RestaurantStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

class RestaurantOut(RestaurantBase):
    id: int
    rating: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    status: str
    rejection_reason: Optional[str] = None
    
    owner_id: Optional[int] = None
    owner: Optional[OwnerInfo] = None 

    products: List[ProductOut] = []

    class Config:
        from_attributes = True