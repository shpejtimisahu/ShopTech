from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderOut, OrderItemOut, CheckoutIn
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


def enrich_order(order: Order, db: Session) -> OrderOut:
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    enriched_items = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        enriched_items.append(OrderItemOut(
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            product_name=product.name if product else f"Product #{item.product_id}",
            product_image=product.image_url if product else None
        ))
    return OrderOut(
        id=order.id,
        total_price=order.total_price,
        status=order.status,
        created_at=order.created_at,
        items=enriched_items,
        full_name=order.full_name,
        phone=order.phone,
        address=order.address,
        city=order.city,
        postal_code=order.postal_code,
        payment_method=order.payment_method
    )


# ✅ CHECKOUT (Cash on Delivery)
@router.post("/checkout", response_model=OrderOut)
def checkout(
    payload: CheckoutIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart_items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Check stock for all items before creating order
    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product #{item.product_id} not found")
        if item.quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for '{product.name}'. Available: {product.stock}"
            )

    # Create order (cash on delivery — no online payment)
    order = Order(
        user_id=current_user.id,
        total_price=0,
        full_name=payload.full_name,
        phone=payload.phone,
        address=payload.address,
        city=payload.city,
        postal_code=payload.postal_code,
        payment_method="cash",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    total_price = 0

    for item in cart_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue

        price = product.price * item.quantity
        total_price += price

        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=price
        )
        db.add(order_item)

        # Reduce stock
        product.stock -= item.quantity

    order.total_price = total_price

    # Clear cart
    for item in cart_items:
        db.delete(item)

    db.commit()
    db.refresh(order)

    return enrich_order(order, db)


# ✅ GET ALL ORDERS
@router.get("/", response_model=list[OrderOut])
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    return [enrich_order(order, db) for order in orders]


# ✅ GET SINGLE ORDER
@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return enrich_order(order, db)


# ✅ CANCEL ORDER
@router.put("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled")

    if order.status == "delivered":
        raise HTTPException(status_code=400, detail="Cannot cancel a delivered order")

    # Return stock back
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in order_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    order.status = "cancelled"
    db.commit()
    db.refresh(order)

    return enrich_order(order, db)


# ✅ CONFIRM RECEIVED (client confirms delivery)
@router.put("/{order_id}/confirm-received", response_model=OrderOut)
def confirm_received(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != "shipped":
        raise HTTPException(status_code=400, detail="Only shipped orders can be confirmed as received")

    order.status = "delivered"
    db.commit()
    db.refresh(order)

    return enrich_order(order, db)


# ✅ UPDATE ORDER STATUS (Admin only)
@router.put("/admin/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_user)
):
    from app.utils.jwt import get_current_admin
    if not current_admin.is_admin:
        from fastapi import HTTPException as H
        raise H(status_code=403, detail="Admin access required")

    valid_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Status transition rules
    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot update a cancelled order")

    if order.status == "delivered":
        raise HTTPException(status_code=400, detail="Cannot update a delivered order")

    # If cancelling, return stock (allowed from any non-final status)
    if new_status == "cancelled":
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        for item in order_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock += item.quantity

    order.status = new_status
    db.commit()
    db.refresh(order)

    return enrich_order(order, db)


# ✅ GET ALL ORDERS (Admin only)
@router.get("/admin/all", response_model=list[OrderOut])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    orders = db.query(Order).order_by(Order.id.desc()).all()
    return [enrich_order(order, db) for order in orders]


# ✅ DELETE ALL ORDERS (Admin only)
@router.delete("/admin/clear-history")
def clear_order_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Delete all order items first
    db.query(OrderItem).delete()
    # Then delete all orders
    db.query(Order).delete()
    db.commit()

    return {"message": "All orders deleted successfully"}
