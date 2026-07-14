from sqlalchemy import Column, Integer, String, Text
from app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    description = Column(Text)
    price = Column(Integer)
    stock = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True, default="Other")
