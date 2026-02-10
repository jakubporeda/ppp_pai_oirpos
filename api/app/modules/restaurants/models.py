from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base 

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    rating = Column(Float, default=0.0)
    #average_rating = Column(Float, default=0.0)
    cuisines = Column(String) 
    city = Column(String, default="")
    street = Column(String, default="")
    number = Column(String, default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Status: 'pending', 'approved', 'rejected'
    status = Column(String, default="pending") 
    
    # --- NOWE POLE: POWÓD ODRZUCENIA ---
    rejection_reason = Column(String, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    description = Column(String, nullable=True, default="")  

    products = relationship("Product", back_populates="restaurant", cascade="all, delete-orphan")
    owner = relationship("app.modules.users.models.User", back_populates="restaurants")

    orders = relationship("app.modules.orders.models.Order", back_populates="restaurant")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String)
    price = Column(Float)
    category = Column(String)

    restaurant = relationship("Restaurant", back_populates="products")