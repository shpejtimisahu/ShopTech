from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class OrderItemOut(BaseModel):
    product_id: int
    quantity: int
    price: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    total_price: int
    status: str
    created_at: datetime
    items: List[OrderItemOut] = []
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    payment_method: Optional[str] = "cash"

    class Config:
        from_attributes = True


class CheckoutIn(BaseModel):
    full_name: str
    phone: str
    address: str
    city: str
    postal_code: Optional[str] = None