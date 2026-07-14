from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.db.session import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("/admin/overview")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Total counts
    total_products = db.query(Product).count()
    total_users = db.query(User).count()
    total_orders = db.query(Order).count()

    # Revenue: sum of total_price for delivered orders only
    delivered_orders = db.query(Order).filter(Order.status == "delivered").all()
    total_revenue = sum(o.total_price for o in delivered_orders)

    # Orders by status
    pending_count = db.query(Order).filter(Order.status == "pending").count()
    delivered_count = db.query(Order).filter(Order.status == "delivered").count()
    cancelled_count = db.query(Order).filter(Order.status == "cancelled").count()


    best_sellers_query = (
        db.query(
            OrderItem.product_id,
            func.sum(OrderItem.quantity).label("total_sold")
        )
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    best_sellers = []
    for product_id, total_sold in best_sellers_query:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            best_sellers.append({
                "id": product.id,
                "name": product.name,
                "image_url": product.image_url,
                "total_sold": int(total_sold),
                "price": product.price
            })


    low_stock = db.query(Product).filter(Product.stock <= 3, Product.stock > 0).count()
    out_of_stock = db.query(Product).filter(Product.stock == 0).count()


    sales_by_day = []
    now = datetime.utcnow()
    current_year = now.year
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for month in range(1, 13):
        month_start = datetime(current_year, month, 1)
        if month == 12:
            month_end = datetime(current_year + 1, 1, 1)
        else:
            month_end = datetime(current_year, month + 1, 1)
        month_orders = db.query(Order).filter(
            Order.created_at >= month_start,
            Order.created_at < month_end
        ).all()
        month_revenue = sum(o.total_price for o in month_orders)
        sales_by_day.append({
            "date": month_names[month - 1],
            "orders": len(month_orders),
            "revenue": month_revenue
        })

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products": total_products,
        "total_users": total_users,
        "orders_by_status": {
            "pending": pending_count,
            "delivered": delivered_count,
            "cancelled": cancelled_count
        },
        "best_sellers": best_sellers,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "sales_by_day": sales_by_day
    }
