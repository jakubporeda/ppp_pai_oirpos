from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
from pydantic import BaseModel

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    
    # Klucze obce
    user_id = Column(Integer, ForeignKey("users.id")) 
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    
    # Status zamówienia – teraz zmiany będą zapisywane w bazie
    status = Column(String, default="confirmed")  
    
    total_amount = Column(Float)
    delivery_address = Column(Text)
    delivery_time_type = Column(String)
    payment_method = Column(String)
    document_type = Column(String)
    nip = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # --- RELACJE ---
    user = relationship("app.modules.users.models.User", back_populates="orders")
    restaurant = relationship("app.modules.restaurants.models.Restaurant", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    
    # Produkt z restauracji
    product_id = Column(Integer, ForeignKey("products.id")) 
    
    quantity = Column(Integer)
    price = Column(Float)
    name = Column(String)

    order = relationship("Order", back_populates="items")
    product = relationship("app.modules.restaurants.models.Product")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    rating = Column(Integer, nullable=False)  # 1–5
    comment = Column(String, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)

    created_at = Column(DateTime, default=datetime.utcnow)


