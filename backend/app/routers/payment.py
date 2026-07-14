import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.user import User
from app.utils.jwt import get_current_user
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/payment", tags=["Payment"])


class PaymentIntentResponse(BaseModel):
    client_secret: str
    amount: int
    publishable_key: str


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
def create_payment_intent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get user's cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart_items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Calculate total
    total = 0
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            total += product.price * item.quantity

    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid cart total")

    # Create Stripe PaymentIntent (amount in cents)
    try:
        intent = stripe.PaymentIntent.create(
            amount=total * 100,  # Stripe uses cents
            currency="usd",
            metadata={"user_id": current_user.id}
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return PaymentIntentResponse(
        client_secret=intent.client_secret,
        amount=total,
        publishable_key=settings.STRIPE_PUBLISHABLE_KEY
    )