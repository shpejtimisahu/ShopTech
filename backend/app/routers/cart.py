from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemOut
from app.models.user import User
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])


def get_or_create_cart(user_id: int, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


@router.post("/add", response_model=CartItemOut)
def add_to_cart(
    item: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check product exists
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = get_or_create_cart(current_user.id, db)

    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item.product_id
    ).first()

    new_quantity = (existing_item.quantity if existing_item else 0) + item.quantity

    # Check stock
    if new_quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough stock. Available: {product.stock}"
        )

    if existing_item:
        existing_item.quantity = new_quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
        return cart_item


@router.get("/")
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_or_create_cart(current_user.id, db)
    cart_items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    return cart_items


@router.put("/update")
def update_cart(
    product_id: int,
    quantity: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check stock
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough stock. Available: {product.stock}"
        )

    cart = get_or_create_cart(current_user.id, db)

    cart_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product_id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Product not in cart")

    cart_item.quantity = quantity
    db.commit()

    return {"message": "Cart updated"}


@router.delete("/remove/{product_id}")
def remove_from_cart(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = get_or_create_cart(current_user.id, db)

    cart_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product_id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Product not in cart")

    db.delete(cart_item)
    db.commit()

    return {"message": "Product removed from cart"}