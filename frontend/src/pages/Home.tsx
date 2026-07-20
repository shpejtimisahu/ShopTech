import { useEffect, useState, useRef } from "react";
import { api } from "../api/api";
import { useCart } from "../App";
import { useToast } from "../components/Toast";
import { ProductGridSkeleton } from "../components/Loading";

const BACKEND_URL = "http://127.0.0.1:8000";
const PER_PAGE_OPTIONS = [20, 30, 50];

const CATEGORIES = ["All","Laptops & Computers","Phones & Tablets","Gaming","Accessories","Monitors","Audio","Cameras","Other"];
const CATEGORY_ICONS: Record<string, string> = {
  "All":"⚡","Laptops & Computers":"💻","Phones & Tablets":"📱","Gaming":"🎮",
  "Accessories":"🎧","Monitors":"🖥️","Audio":"🔊","Cameras":"📷","Other":"📦"
};

function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("All");
  const [priceMax, setPriceMax] = useState(5000);
  const [sortBy, setSortBy] = useState("default");
  const [limit, setLimit] = useState(20);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const { refreshCart } = useCart();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (searchInput.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const t = setTimeout(() => {
      api.get(`/products/?name=${searchInput}&limit=5`)
        .then(res => { setSuggestions(res.data.products); setShowSuggestions(true); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchProducts = (currentPage: number, searchTerm: string, cat: string) => {
    setLoading(true);
    const skip = (currentPage - 1) * limit;
    const params = new URLSearchParams({
      skip: String(skip), limit: String(limit),
      ...(searchTerm ? { name: searchTerm } : {}),
      ...(cat && cat !== "All" ? { category: cat } : {})
    });
    api.get(`/products/?${params}`)
      .then(res => { setProducts(res.data.products); setTotal(res.data.total); })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(page, search, category); }, [page, search, category, limit]);

  // Lock page scroll when product modal is open
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedProduct]);

  const addToCart = (productId: number) => {
    api.post("/cart/add", { product_id: productId, quantity: 1 })
      .then(() => { showToast("Added to cart!", "success"); refreshCart(); })
      .catch(err => showToast(err.response?.data?.detail || "Could not add to cart", "error"));
  };

  const openProduct = (product: any) => {
    setSelectedProduct(product);
    setRecommendations([]);
    setShowSuggestions(false);
    api.get(`/recommendations/${product.id}`)
      .then(res => setRecommendations(res.data))
      .catch(() => {});
  };

  const getImageSrc = (image_url: string) => {
    if (!image_url) return null;
    return image_url.startsWith("http") ? image_url : `${BACKEND_URL}${image_url}`;
  };

  const highlight = (text: string, query: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return <>{text.slice(0, idx)}<span className="font-bold text-indigo-600">{text.slice(idx, idx + query.length)}</span>{text.slice(idx + query.length)}</>;
  };

  // Apply price filter and sorting (client-side on current page)
  const displayProducts = [...products]
    .filter(p => p.price <= priceMax)
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  {selectedProduct.category && selectedProduct.category !== "Other" && (
                    <span className="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-full mb-2 inline-block">
                      {CATEGORY_ICONS[selectedProduct.category]} {selectedProduct.category}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">{selectedProduct.name}</h2>
                </div>
                <button onClick={() => setSelectedProduct(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">✕</button>
              </div>
              {getImageSrc(selectedProduct.image_url) ? (
                <img src={getImageSrc(selectedProduct.image_url)!} alt={selectedProduct.name}
                  className="w-full h-64 object-contain rounded-2xl mb-4 bg-gray-50" />
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-2xl mb-4 flex items-center justify-center text-gray-400">No image</div>
              )}
              <p className="text-gray-600 mb-4 leading-relaxed">{selectedProduct.description}</p>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-3xl font-bold text-indigo-600">${selectedProduct.price}</p>
                  <p className="text-sm text-green-500 font-medium mt-0.5">✓ In Stock</p>
                </div>
              </div>
              <button onClick={() => addToCart(selectedProduct.id)}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                🛒 Add to Cart
              </button>
              {recommendations.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Recommended for You</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Similar products based on analysis</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {recommendations.map(rec => (
                      <div key={rec.id} onClick={() => openProduct(rec)}
                        className="border border-gray-100 rounded-2xl p-3 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all">
                        {getImageSrc(rec.image_url) ? (
                          <img src={getImageSrc(rec.image_url)!} alt={rec.name} className="w-full h-20 object-contain rounded-xl mb-2 bg-gray-50" />
                        ) : (
                          <div className="w-full h-20 bg-gray-100 rounded-xl mb-2" />
                        )}
                        <p className="font-semibold text-xs text-gray-800 line-clamp-1">{rec.name}</p>
                        <p className="text-indigo-600 text-sm font-bold mt-0.5">${rec.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HERO BANNER - Compact */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(120deg, #1a1a4e, #312e81, #4c1d95)" }}>
        {/* Decorative glow */}
        <div className="absolute -top-10 right-1/3 w-72 h-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />
        <div className="absolute -bottom-10 left-1/4 w-60 h-60 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #c084fc, transparent)" }} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Discover{" "}
                <span style={{ background: "linear-gradient(90deg, #a5b4fc, #d8b4fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Premium Tech
                </span>
              </h1>
              <p className="text-white/60 text-sm mt-1.5 max-w-md">
                High-performance devices for gaming and productivity.
              </p>
            </div>

            <div className="flex gap-2.5 flex-shrink-0">
              <button onClick={() => { setCategory("Gaming"); setPage(1); }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/50 whitespace-nowrap">
                Browse Gaming →
              </button>
              <button onClick={() => { setCategory("All"); setPage(1); }}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all backdrop-blur whitespace-nowrap">
                View All
              </button>
            </div>
          </div>

          {/* Quick feature pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            <span className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur border border-white/10 text-white/70 text-xs px-3 py-1.5 rounded-lg">
              📦 500+ Products
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur border border-white/10 text-white/70 text-xs px-3 py-1.5 rounded-lg">
              🚚 Fast Delivery
            </span>

          </div>
        </div>
      </div>

      {/* MAIN CONTENT - FULL WIDTH */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-8">

        {/* Search + Categories bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div ref={searchRef} className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" placeholder="Search products, brands... (press Enter)"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                value={searchInput}
                onChange={e => {
                  const val = e.target.value;
                  setSearchInput(val);
                  // If cleared, restore all products automatically
                  if (val.trim() === "") {
                    setSearch("");
                    setPage(1);
                  }
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    setSearch(searchInput);
                    setPage(1);
                    setShowSuggestions(false);
                  }
                }}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); setShowSuggestions(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {suggestions.map(s => (
                    <div key={s.id} onClick={() => { setShowSuggestions(false); openProduct(s); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                      {getImageSrc(s.image_url) ? (
                        <img src={getImageSrc(s.image_url)!} alt={s.name} className="w-10 h-10 object-contain rounded-lg bg-gray-50 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{highlight(s.name, searchInput)}</p>
                        <p className="text-xs text-gray-400 truncate">{s.description}</p>
                      </div>
                      <p className="text-sm font-bold text-indigo-600 flex-shrink-0">${s.price}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    category === cat ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  <span>{CATEGORY_ICONS[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price + Sort toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Price range */}
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">💰 Max Price:</span>
            <input type="range" min="100" max="5000" step="50" value={priceMax}
              onChange={e => setPriceMax(Number(e.target.value))}
              className="flex-1 accent-indigo-600 max-w-xs" />
            <span className="text-sm font-bold text-indigo-600 whitespace-nowrap min-w-[70px]">
              ${priceMax.toLocaleString()}
            </span>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer">
              <option value="default">Default</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="name">Name: A → Z</option>
            </select>
          </div>

          {/* Per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Show:</span>
            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer">
              {PER_PAGE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt} per page</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{category !== "All" ? category : "All Products"}</h2>
            <p className="text-sm text-gray-400">
              {total > 0 ? (
                <>Showing <span className="font-semibold text-gray-600">{displayProducts.length}</span> of <span className="font-semibold text-gray-600">{total}</span> products</>
              ) : (
                "No products found"
              )}
            </p>
          </div>
        </div>

        {/* LOADING */}
        {loading && <ProductGridSkeleton count={10} />}

        {/* NO RESULTS */}
        {!loading && displayProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg font-medium">No products found</p>
            <button onClick={() => { setSearchInput(""); setSearch(""); setCategory("All"); setPage(1); setPriceMax(5000); setSortBy("default"); }}
              className="mt-4 text-indigo-600 font-semibold hover:underline text-sm">Clear filters</button>
          </div>
        )}

        {/* PRODUCT GRID - 5 columns on large screens to fill width */}
        {!loading && displayProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {displayProducts.map((p) => (
            <div key={p.id}
              className="bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group"
              onClick={() => openProduct(p)}>
              <div className="relative bg-gray-50 p-4">
                {getImageSrc(p.image_url) ? (
                  <img src={getImageSrc(p.image_url)!} alt={p.name}
                    className="w-full h-44 object-contain group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-44 flex items-center justify-center text-gray-300 text-4xl">📦</div>
                )}
                {p.category && p.category !== "Other" && (
                  <span className="absolute top-3 left-3 text-xs bg-white/90 backdrop-blur text-gray-600 font-medium px-2 py-0.5 rounded-lg shadow-sm">
                    {CATEGORY_ICONS[p.category]} {p.category}
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{p.name}</h3>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2 flex-1">{p.description}</p>
                <div className="mt-3">
                  <p className="font-bold text-lg text-indigo-600">${p.price}</p>
                  <p className="text-xs text-green-500 font-medium mb-3">✓ In Stock</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(p.id); }}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              ← Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                  page === p ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
