from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="user")
    
    role_request = Column(String, nullable=True)  

    # Adres Główny
    street = Column(String)
    city = Column(String)
    postal_code = Column(String)
    
    # Zgody
    terms_accepted = Column(Boolean, default=False)
    marketing_consent = Column(Boolean, default=False)
    data_processing_consent = Column(Boolean, default=False)

    # Relacje
    restaurants = relationship("app.modules.restaurants.models.Restaurant", back_populates="owner")
    
    # NOWOŚĆ: Relacja do dodatkowych adresów
    additional_addresses = relationship("UserAddress", back_populates="user", cascade="all, delete-orphan")

    #relacja z zamówieniami
    orders = relationship("app.modules.orders.models.Order", back_populates="user")


# NOWA TABELA
class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String) # np. "Praca"
    city = Column(String)
    street = Column(String)
    number = Column(String)
    
    user = relationship("User", back_populates="additional_addresses")


