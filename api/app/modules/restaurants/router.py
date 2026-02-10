# api/app/modules/restaurants/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import jwt, JWTError
import urllib.request
import urllib.parse
import json

from app.db.database import get_db
from app.core.config import SECRET_KEY, ALGORITHM
from app.modules.users import models as user_models
from . import models, schemas

router = APIRouter()

MAPBOX_TOKEN = "pk.eyJ1Ijoicm9yaWsiLCJhIjoiY21qN3JvaDh5MDV4cDNncXpkM3RlNmVzZCJ9.HemoDNLmVXXnG2OTEb3H7g"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# --- POMOCNIK: Get User ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(user_models.User).filter(user_models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- GEOCODING ---
def get_coordinates(city: str, street: str, number: str):
    try:
        full_address = f"{street} {number}, {city}"
        encoded_query = urllib.parse.quote(full_address)
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{encoded_query}.json?access_token={MAPBOX_TOKEN}&limit=1"
        
        with urllib.request.urlopen(url) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                if data.get("features"):
                    center = data["features"][0]["center"]
                    return float(center[1]), float(center[0])
    except Exception as e:
        print(f"Mapbox error: {e}")
        pass
    return None, None

# ==========================================
# ENDPOINTY
# ==========================================

# 1. PUBLICZNE: Tylko zatwierdzone
@router.get("/", response_model=List[schemas.RestaurantOut])
def get_approved_restaurants(cuisine: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Restaurant).filter(models.Restaurant.status == "approved")
    if cuisine:
        all_restaurants = query.all()
        return [r for r in all_restaurants if cuisine.lower() in r.cuisines.lower()]
    return query.all()

# 2. WŁAŚCICIEL: Moje restauracje
@router.get("/mine", response_model=List[schemas.RestaurantOut])
def get_my_restaurants(current_user: user_models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Restaurant).filter(models.Restaurant.owner_id == current_user.id).all()

# 3. WŁAŚCICIEL: Wniosek (Tworzenie)
@router.post("/", response_model=schemas.RestaurantOut, status_code=status.HTTP_201_CREATED)
def create_restaurant_application(
    restaurant: schemas.RestaurantCreate, 
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user)
):
    lat, lon = get_coordinates(restaurant.city, restaurant.street, restaurant.number)
    db_restaurant = models.Restaurant(
        name=restaurant.name, 
        rating=restaurant.rating, 
        cuisines=restaurant.cuisines,
        city=restaurant.city,
        street=restaurant.street,
        number=restaurant.number,
        latitude=lat,
        longitude=lon,
        status="pending",
        owner_id=current_user.id,
        description=restaurant.description
    )
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

# 4. ADMIN: Nowe wnioski (pending)
@router.get("/applications", response_model=List[schemas.RestaurantOut])
def get_restaurant_applications(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    return db.query(models.Restaurant).filter(models.Restaurant.status == "pending").all()

# 5. ADMIN: Historia wniosków (approved/rejected)
@router.get("/applications/history", response_model=List[schemas.RestaurantOut])
def get_applications_history(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    return db.query(models.Restaurant).filter(models.Restaurant.status != "pending").all()

# 6. ADMIN: Zmiana statusu (Decyzja)
@router.put("/{restaurant_id}/status", response_model=schemas.RestaurantOut)
def update_restaurant_status(
    restaurant_id: int,
    status_data: schemas.RestaurantStatusUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restauracja nie znaleziona")
    
    restaurant.status = status_data.status
    
    # Jeśli odrzucono, zapisz powód
    if status_data.status == "rejected" and status_data.rejection_reason:
        restaurant.rejection_reason = status_data.rejection_reason
    
    # Jeśli zaakceptowano, wyczyść powód
    if status_data.status == "approved":
        restaurant.rejection_reason = None

    db.commit()
    db.refresh(restaurant)
    return restaurant

# 7. ADMIN: Pobierz WSZYSTKIE (do tabeli zarządzania)
@router.get("/all", response_model=List[schemas.RestaurantOut])
def get_all_restaurants_for_admin(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Brak uprawnień")
    
    return db.query(models.Restaurant).all()

# 8. EDYCJA DANYCH (PUT) - ADMIN i WŁAŚCICIEL
@router.put("/{restaurant_id}", response_model=schemas.RestaurantOut)
def update_restaurant_details(
    restaurant_id: int,
    restaurant_update: schemas.RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user)
):
    # Pobierz restaurację
    db_rest = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not db_rest:
        raise HTTPException(status_code=404, detail="Restauracja nie znaleziona")

    # Sprawdź uprawnienia (Admin lub Właściciel tego lokalu)
    if current_user.role != 'admin' and db_rest.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Brak uprawnień do edycji tego lokalu")

    # --- NOWA LOGIKA: RESET STATUSU PRZY EDYCJI PRZEZ WŁAŚCICIELA ---
    # Jeśli właściciel edytuje odrzucony lokal, to znaczy, że go poprawia.
    if current_user.role == 'właściciel' and db_rest.status == 'rejected':
        db_rest.status = 'pending'       # Wracamy do kolejki Admina
        db_rest.rejection_reason = None  # Czyścimy powód

    # Logika aktualizacji pól
    if restaurant_update.name:
        db_rest.name = restaurant_update.name
    if restaurant_update.cuisines:
        db_rest.cuisines = restaurant_update.cuisines
    if restaurant_update.rating is not None:
        db_rest.rating = restaurant_update.rating
    if restaurant_update.description is not None:
        db_rest.description = restaurant_update.description

    # Logika zmiany adresu -> Wymaga ponownego Geocodingu!
    address_changed = False
    if restaurant_update.city and restaurant_update.city != db_rest.city:
        db_rest.city = restaurant_update.city
        address_changed = True
    if restaurant_update.street and restaurant_update.street != db_rest.street:
        db_rest.street = restaurant_update.street
        address_changed = True
    if restaurant_update.number and restaurant_update.number != db_rest.number:
        db_rest.number = restaurant_update.number
        address_changed = True
    
    if address_changed:
        lat, lon = get_coordinates(db_rest.city, db_rest.street, db_rest.number)
        db_rest.latitude = lat
        db_rest.longitude = lon

    db.commit()
    db.refresh(db_rest)
    return db_rest

# 9. DELETE (Uniwersalne usuwanie)
@router.delete("/{restaurant_id}")
def delete_restaurant(
    restaurant_id: int, 
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_user)
):
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restauracja nie znaleziona")
    
    # Tylko Admin lub Właściciel TEGO lokalu może usunąć
    if restaurant.owner_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Brak uprawnień")
    
    db.delete(restaurant)
    db.commit()
    return {"message": "Restauracja usunięta"}

# --- Produkty ---
@router.get("/{restaurant_id}/products", response_model=List[schemas.ProductOut])
def get_products(restaurant_id: int, db: Session = Depends(get_db)):
    return db.query(models.Product).filter(models.Product.restaurant_id == restaurant_id).all()

@router.post("/products", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: user_models.User = Depends(get_current_user)):
    # Opcjonalnie można dodać sprawdzanie, czy current_user to właściciel restauracji
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: user_models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produkt nie znaleziony")
    db.delete(product)
    db.commit()
    return {"message": "Produkt usunięty"}


# 10. PUBLICZNE: Lista dostępnych kuchni
@router.get("/cuisines", response_model=List[str])
def get_available_cuisines(db: Session = Depends(get_db)):
    restaurants = db.query(models.Restaurant).filter(
        models.Restaurant.status == "approved"
    ).all()

    cuisines_set = set()

    for r in restaurants:
        if r.cuisines:
            # rozbijamy po przecinku
            for c in r.cuisines.split(","):
                cuisines_set.add(c.strip())

    return sorted(list(cuisines_set))

# 10. Dodawanie opisu restauracji
@router.put("/restaurants/{restaurant_id}", response_model=schemas.RestaurantOut)
def update_restaurant(
    restaurant_id: int,
    payload: schemas.RestaurantUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    rest = db.query(models.Restaurant).filter(models.Restaurant.id==restaurant_id, models.Restaurant.owner_id==user.id).first()
    if not rest:
        raise HTTPException(status_code=404, detail="Nie znaleziono restauracji")
    
    # aktualizacja tylko pól, które zostały przesłane
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(rest, key, value)

    db.commit()
    db.refresh(rest)
    return rest

