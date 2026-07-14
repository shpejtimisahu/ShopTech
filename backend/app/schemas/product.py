from pydantic import BaseModel, Field
from typing import Optional, List

CATEGORIES = [
    "Laptops & Computers",
    "Phones & Tablets",
    "Gaming",
    "Accessories",
    "Monitors",
    "Audio",
    "Cameras",
    "Other"
]

class ProductBase(BaseModel):
    name: str
    description: str
    price: int = Field(gt=0)
    stock: int = Field(ge=0)
    image_url: Optional[str] = None
    category: Optional[str] = "Other"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None
    category: Optional[str] = None


class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True


class ProductPage(BaseModel):
    products: List[ProductOut]
    total: int
    skip: int
    limit: int