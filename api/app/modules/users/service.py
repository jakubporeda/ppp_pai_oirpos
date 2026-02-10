from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password, create_access_token
from .models import User

def create_user(db: Session, data):
    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone_number=data.phone_number,
        hashed_password=hash_password(data.password),
        role=data.role,
        street=data.street,
        city=data.city,
        postal_code=data.postal_code,
        terms_accepted=data.terms_accepted,
        marketing_consent=data.marketing_consent,
        data_processing_consent=data.data_processing_consent,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    token = create_access_token({"sub": user.email})
    return token
