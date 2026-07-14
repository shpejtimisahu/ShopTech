from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductOut

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/{product_id}", response_model=list[ProductOut])
def get_recommendations(product_id: int, limit: int = 3, db: Session = Depends(get_db)):
    products = db.query(Product).all()

    if len(products) < 2:
        return []

    # Combine name + description for each product
    corpus = [f"{p.name} {p.description}" for p in products]

    # Build TF-IDF matrix
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(corpus)

    # Find index of the requested product
    product_ids = [p.id for p in products]
    if product_id not in product_ids:
        return []

    idx = product_ids.index(product_id)

    # Compute cosine similarity
    similarity_scores = cosine_similarity(tfidf_matrix[idx], tfidf_matrix).flatten()

    # Sort by similarity, exclude the product itself
    similar_indices = np.argsort(similarity_scores)[::-1]
    similar_indices = [i for i in similar_indices if product_ids[i] != product_id]

    # Return top N recommendations
    recommended = [products[i] for i in similar_indices[:limit]]
    return recommended