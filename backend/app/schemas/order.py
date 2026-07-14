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

    class Config:
        from_attributes = True