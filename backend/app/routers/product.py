import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate, ProductPage
from app.utils.jwt import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/products", tags=["Products"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# CREATE PRODUCT
@router.post("/", response_model=ProductOut)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# GET CATEGORIES
@router.get("/categories", response_model=list[str])
def get_categories(db: Session = Depends(get_db)):
    from app.schemas.product import CATEGORIES
    return CATEGORIES


# GET ALL PRODUCTS
@router.get("/", response_model=ProductPage)
def get_products(skip: int = 0, limit: int = 8, name: str = None, category: str = None, db: Session = Depends(get_db)):
    query = db.query(Product).filter(Product.stock > 0)
    if name:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{name}%"),
                Product.description.ilike(f"%{name}%")
            )
        )
    if category and category != "All":
        query = query.filter(Product.category == category)
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    return {"products": products, "total": total, "skip": skip, "limit": limit}


# GET ALL PRODUCTS FOR ADMIN (includes out of stock)
@router.get("/admin/all", response_model=list[ProductOut])
def get_all_products_admin(skip: int = 0, limit: int = 100, name: str = None, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    query = db.query(Product)
    if name:
        query = query.filter(Product.name.ilike(f"%{name}%"))
    return query.offset(skip).limit(limit).all()


# GET SINGLE PRODUCT
@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# UPDATE PRODUCT
@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, updated: ProductUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in updated.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


# UPLOAD IMAGE
@router.post("/{product_id}/upload-image", response_model=ProductOut)
async def upload_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    # Save file with unique name
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    # Save URL to product
    product.image_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(product)

    return product


# DELETE PRODUCT
@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}