from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.db.database import get_db
from app.modules.users.router import get_current_user
from app.modules.users.models import User
from app.modules.restaurants.models import Restaurant, Product
from . import models, schemas
from pydantic import BaseModel
from .models import Order, Review, OrderItem
from .schemas import ReviewCreate, ReorderRequest


router = APIRouter()
logger = logging.getLogger(__name__)



# ==========================================
# ENDPOINTY ZAMÓWIEŃ
# ==========================================

@router.post("/", response_model=schemas.OrderResponse)
def create_order(
    order_data: schemas.OrderCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Tworzy nowe zamówienie.
    """
    logger.info(f"Tworzenie zamówienia dla użytkownika {current_user.id}")
    
    restaurant = db.query(Restaurant).filter(Restaurant.id == order_data.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restauracja nie znaleziona")
    
    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produkt o ID {item.product_id} nie znaleziony")
    
    new_order = models.Order(
        user_id=current_user.id,
        restaurant_id=order_data.restaurant_id,
        total_amount=order_data.total_amount,
        status="confirmed",
        delivery_address=order_data.delivery_address,
        delivery_time_type=order_data.delivery_time_type,
        payment_method=order_data.payment_method,
        document_type=order_data.document_type,
        nip=order_data.nip,
        remarks=order_data.remarks
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        new_item = models.OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            name=product.name if product else item.name
        )
        db.add(new_item)
    db.commit()
    db.refresh(new_order)
    
    logger.info(f"Zamówienie {new_order.id} utworzone pomyślnie")
    
    return {
        "id": new_order.id,
        "user_id": new_order.user_id,
        "restaurant_id": new_order.restaurant_id,
        "status": new_order.status,
        "total_amount": new_order.total_amount,
        "delivery_address": new_order.delivery_address,
        "delivery_time_type": new_order.delivery_time_type,
        "payment_method": new_order.payment_method,
        "document_type": new_order.document_type,
        "nip": new_order.nip,
        "remarks": new_order.remarks,
        "created_at": new_order.created_at,
        "items": new_order.items,
        "restaurant_name": restaurant.name,
        "restaurant_address": f"{restaurant.street} {restaurant.number}, {restaurant.city}"
    }

# ------------------------------------------
# Pobierz historię zamówień klienta
# ------------------------------------------
@router.get("/my-orders", response_model=List[schemas.OrderResponse])
def get_my_orders(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    orders = db.query(models.Order)\
        .filter(models.Order.user_id == current_user.id)\
        .order_by(models.Order.created_at.desc())\
        .all()
    
    result = []
    for order in orders:
        restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
        result.append({
            "id": order.id,
            "user_id": order.user_id,
            "restaurant_id": order.restaurant_id,
            "status": order.status,
            "total_amount": order.total_amount,
            "delivery_address": order.delivery_address,
            "delivery_time_type": order.delivery_time_type,
            "payment_method": order.payment_method,
            "document_type": order.document_type,
            "nip": order.nip,
            "remarks": order.remarks,
            "created_at": order.created_at,
            "items": order.items,
            "restaurant_name": restaurant.name if restaurant else "Nieznana restauracja",
            "restaurant_address": f"{restaurant.street} {restaurant.number}, {restaurant.city}" if restaurant else ""
        })
    return result

# ------------------------------------------
# Pobierz aktywne zamówienie klienta
# ------------------------------------------
@router.get("/active", response_model=Optional[schemas.OrderResponse])
def get_active_order(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    active_statuses = ["confirmed", "preparing", "delivery", "arrived"]
    order = db.query(models.Order)\
        .filter(models.Order.user_id == current_user.id)\
        .filter(models.Order.status.in_(active_statuses))\
        .order_by(models.Order.created_at.desc())\
        .first()
    
    if order:
        restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
        return {
            **order.__dict__,
            "items": order.items,
            "restaurant_name": restaurant.name if restaurant else "",
            "restaurant_address": f"{restaurant.street} {restaurant.number}, {restaurant.city}" if restaurant else ""
        }
    return None

# ------------------------------------------
# Pobierz zamówienia dla właściciela restauracji
# ------------------------------------------
@router.get("/owner", response_model=List[schemas.OrderResponse])
def get_restaurant_orders(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "właściciel":
        return []

    my_restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not my_restaurant:
        return []

    orders = db.query(models.Order)\
        .filter(models.Order.restaurant_id == my_restaurant.id)\
        .order_by(models.Order.created_at.desc())\
        .all()

    result = []
    for order in orders:
        restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
        result.append({
            **order.__dict__,
            "items": order.items,
            "restaurant_name": restaurant.name if restaurant else "",
            "restaurant_address": f"{restaurant.street} {restaurant.number}, {restaurant.city}" if restaurant else ""
        })
    return result


# ------------------------------------------
# Zmiana statusu zamówienia przez właściciela
# ------------------------------------------

class OrderStatusUpdate(BaseModel):
    new_status: str

@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,   # FastAPI bierze new_status z body
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_status = status_update.new_status
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")

    # Jeśli właściciel restauracji
    if current_user.role == "właściciel":
        restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
        if not restaurant or restaurant.id != order.restaurant_id:
            raise HTTPException(status_code=403, detail="Nie możesz zmieniać zamówień tej restauracji")
    
    # Jeśli klient
    elif current_user.role in ["klient", "user"]:
        if order.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Nie możesz zmieniać cudzego zamówienia"
            )
        if new_status not in ["delivered", "completed"]:
            raise HTTPException(
                status_code=403,
                detail="Klient może tylko potwierdzić odbiór"
            )
    
    # Inne role
    else:
        raise HTTPException(status_code=403, detail="Brak uprawnień")

    # Aktualizacja statusu
    order.status = new_status
    db.commit()
    db.refresh(order)

    restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    return {
        "id": order.id,
        "status": order.status,
        "created_at": order.created_at,
        "total_amount": order.total_amount,
        "restaurant_id": order.restaurant_id,
        "delivery_address": order.delivery_address,
        "delivery_time_type": order.delivery_time_type,
        "payment_method": order.payment_method,
        "document_type": order.document_type,
        "nip": order.nip,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,
                "name": item.name
            } for item in order.items
        ],
        "restaurant_name": restaurant.name if restaurant else "",
        "restaurant_address": f"{restaurant.street} {restaurant.number}, {restaurant.city}" if restaurant else ""
    }


# =========================
# OCENY RESTAURACJI
# =========================

@router.post("/{order_id}/review")
def add_review(
    order_id: int, 
    review: ReviewCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(404, "Zamówienie nie istnieje")

    if order.user_id != current_user.id:
        raise HTTPException(403, "Nie możesz oceniać cudzych zamówień")

    if order.status not in ["delivered", "completed"]:
        raise HTTPException(400, "Zamówienie nie zostało jeszcze dostarczone")

    existing = db.query(Review).filter(Review.order_id == order.id).first()
    if existing:
        raise HTTPException(400, "To zamówienie jest już ocenione")

    # --- dodajemy nową recenzję ---
    new_review = Review(
        rating=review.rating,
        comment=review.comment,
        user_id=current_user.id,
        restaurant_id=order.restaurant_id,
        order_id=order.id
    )
    db.add(new_review)
    db.commit()

    # --- przelicz średnią ocenę restauracji ---
    restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
    all_reviews = db.query(Review).filter(Review.restaurant_id == restaurant.id).all()
    restaurant.rating = round(sum(r.rating for r in all_reviews) / len(all_reviews),1)
    db.commit()

    return {
        "message": "Dziękujemy za ocenę!",
        "average_rating": restaurant.rating
    }


# =========================
# GET MOJE REVIEWS (dla właściciela)
# =========================
@router.get("/reviews/mine")
def get_my_restaurant_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "właściciel":
        raise HTTPException(403, "Nie jesteś właścicielem żadnej restauracji")

    # Pobierz restaurację właściciela
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        return []

    # Pobierz wszystkie recenzje dla tej restauracji
    reviews = db.query(Review).filter(Review.restaurant_id == restaurant.id).all()
    
    result = []
    for r in reviews:
        # Pobierz powiązane zamówienie
        order = db.query(Order).filter(Order.id == r.order_id).first()
        items = [{"quantity": i.quantity, "name": i.name} for i in order.items] if order else []

        # Dodaj recenzję wraz z produktami zamówienia
        result.append({
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "user_id": r.user_id,
            "order_id": r.order_id,
            "restaurant_id": restaurant.id,
            "restaurant_name": restaurant.name,
            "created_at": r.created_at,
            "items": items  # <-- lista zamówionych produktów
        })

    return result

# =========================
# GET reviews dla restauracji (dla klientów)
# =========================
@router.get("/{restaurant_id}/reviews")
def get_restaurant_reviews(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(404, detail="Restauracja nie istnieje")

    reviews = db.query(Review).filter(Review.restaurant_id == restaurant.id).all()
    
    result = []
    for r in reviews:
        order = db.query(Order).filter(Order.id == r.order_id).first()
        items = [{"quantity": i.quantity, "name": i.name} for i in order.items] if order else []

        result.append({
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "user_id": r.user_id,
            "order_id": r.order_id,
            "restaurant_id": restaurant.id,
            "restaurant_name": restaurant.name,
            "created_at": r.created_at,
            "items": items
        })
    
    return result


# =========================
# Ponowne zamówienie
# =========================

@router.post("/reorder")
def reorder(request: ReorderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == request.order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Nie znaleziono zamówienia")

    new_order = Order(
        user_id=current_user.id,
        restaurant_id=order.restaurant_id,
        status="confirmed",
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        delivery_time_type=order.delivery_time_type,
        payment_method=order.payment_method,
        document_type=order.document_type,
        remarks=order.remarks,
        nip=order.nip
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for item in order.items:
        new_item = OrderItem(
            order_id=new_order.id,
            name=item.name,
            quantity=item.quantity,
            price=item.price,
            product_id=item.product_id
        )
        db.add(new_item)
    db.commit()

    return {"detail": "Zamówienie zostało ponowione", "new_order_id": new_order.id}
