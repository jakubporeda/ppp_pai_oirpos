from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from typing import List
from datetime import timedelta

from app.db.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from . import models, schemas

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# --- Helper (Bez zmian) ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# ==========================
# ENDPOINTY (Logowanie/Rejestracja BEZ ZMIAN)
# ==========================

@router.post("/register", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        street=user.street,
        city=user.city,
        postal_code=user.postal_code,
        role="user", 
        terms_accepted=user.terms_accepted,
        marketing_consent=user.marketing_consent,
        data_processing_consent=user.data_processing_consent
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_user(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- ADMIN ---

@router.get("/", response_model=List[schemas.UserOut])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@router.put("/{user_id}/role")
def change_user_role(user_id: int, role: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.role = role
        db.commit()
    return {"message": "Role updated"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db.query(models.User).filter(models.User.id == user_id).delete()
    db.commit()
    return {"message": "User deleted"}

# ==========================
# NOWOŚĆ: ENDPOINTY ADRESOWE
# ==========================

@router.get("/addresses", response_model=List[schemas.UserAddressOut])
def get_my_addresses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return current_user.additional_addresses

@router.post("/addresses", response_model=schemas.UserAddressOut)
def add_new_address(
    address: schemas.UserAddressCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_address = models.UserAddress(
        user_id=current_user.id,
        name=address.name,
        city=address.city,
        street=address.street,
        number=address.number
    )
    db.add(new_address)
    db.commit()
    db.refresh(new_address)
    return new_address

@router.delete("/addresses/{address_id}")
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    address = db.query(models.UserAddress).filter(
        models.UserAddress.id == address_id,
        models.UserAddress.user_id == current_user.id
    ).first()
    
    if not address:
        raise HTTPException(status_code=404, detail="Adres nie znaleziony")
    
    db.delete(address)
    db.commit()
    return {"message": "Adres usunięty"}

@router.post("/request-owner")
def request_restaurant_owner(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "user":
        raise HTTPException(status_code=400, detail="Nie możesz złożyć wniosku")

    if current_user.role_request == "pending":
        raise HTTPException(status_code=400, detail="Wniosek już został wysłany")

    current_user.role_request = "pending"
    db.commit()

    return {"message": "Wniosek o restauratora został wysłany"}

@router.get("/owner-requests", response_model=List[schemas.UserOut])
def get_owner_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403)

    return db.query(models.User).filter(
        models.User.role_request == "pending"
    ).all()

@router.put("/{user_id}/owner-decision")
def owner_decision(
    user_id: int,
    approve: bool,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404)

    if approve:
        user.role = "właściciel"
        user.role_request = None
    else:
        user.role_request = "rejected"

    db.commit()
    return {"message": "Decyzja zapisana"}


