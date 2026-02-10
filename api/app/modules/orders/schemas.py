from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# =======================
# ORDER ITEM SCHEMAS
# =======================
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price: float
    name: str

class OrderItemResponse(OrderItemCreate):
    id: int
    class Config:
        from_attributes = True  # Zamiast orm_mode dla Pydantic v2

# =======================
# ORDER SCHEMAS
# =======================
class OrderCreate(BaseModel):
    restaurant_id: int
    total_amount: float
    delivery_address: str
    delivery_time_type: str
    payment_method: str
    document_type: str
    nip: Optional[str] = None
    remarks: Optional[str] = None
    items: List[OrderItemCreate]

class OrderResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    total_amount: float
    restaurant_id: int
    delivery_address: str
    delivery_time_type: str
    payment_method: str
    document_type: str
    nip: Optional[str]

    remarks: Optional[str] = None   # ⬅⬅⬅ TO DODAJ

    items: List[OrderItemResponse]
    
    # Pola z informacjami o restauracji
    restaurant_name: str
    restaurant_address: str
    
    class Config:
        from_attributes = True

# =======================
# NOWY SCHEMAT: ZMIANA STATUSU
# =======================
class OrderStatusUpdate(BaseModel):
    new_status: str

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

# --- MODEL REQUEST ---
class ReorderRequest(BaseModel):
    order_id: int