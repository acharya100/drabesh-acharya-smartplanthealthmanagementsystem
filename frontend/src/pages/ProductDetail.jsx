import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { eCommerceService } from "../services/api";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import {
  ShoppingCart, Heart, Star, ArrowLeft, Package, Leaf,
  CheckCircle, ChevronDown, ChevronUp, ShoppingBag, Share2
} from "lucide-react";

const ProductDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const isLoggedIn = !!sessionStorage.getItem("access_token");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productRes, relatedRes, reviewsRes] = await Promise.all([
        eCommerceService.getProductById(id),
        eCommerceService.getRelatedProducts(id),
        eCommerceService.getReviews(id),
      ]);
      setProduct(productRes.data);
      setRelated(relatedRes.data);
      setReviews(reviewsRes.data.results || reviewsRes.data);
      // Check wishlist + existing review
      if (isLoggedIn) {
        const idsRes = await eCommerceService.getWishlistIds();
        setWishlisted(idsRes.data.includes(parseInt(id)));
        try {
          const myReviewRes = await eCommerceService.getMyReview(id);
          if (myReviewRes.status === 200 && myReviewRes.data) {
            setExistingReviewId(myReviewRes.data.id);
            setNewReview({ rating: myReviewRes.data.rating, comment: myReviewRes.data.comment || "" });
          }
        } catch (e) { /* no existing review */ }
      }
    } catch (err) {
      console.error("Error loading product:", err);
    } finally {
      setLoading(false);
    }
  }, [id, isLoggedIn]);

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [fetchData]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleWishlistToggle = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      await eCommerceService.toggleWishlist(product.id);
      setWishlisted(w => !w);
    } catch (err) { console.error(err); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { navigate("/login"); return; }
    if (!newReview.rating) { setReviewError("Please select a star rating."); return; }
    setSubmittingReview(true);
    setReviewError("");
    setReviewSuccess(false);
    try {
      await eCommerceService.submitReview({ product: parseInt(id), rating: newReview.rating, comment: newReview.comment });
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      // Reload reviews
      const res = await eCommerceService.getReviews(id);
      setReviews(res.data.results || res.data);
      try {
        const myReviewRes = await eCommerceService.getMyReview(id);
        if (myReviewRes.status === 200 && myReviewRes.data) {
          setExistingReviewId(myReviewRes.data.id);
        }
      } catch (e) { }
    } catch (err) {
      setReviewError(err.response?.data?.error || err.response?.data?.detail || "Could not submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="page-container">
      <Navbar activePage="store" />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div className="spinner"></div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="page-container">
      <Navbar activePage="store" />
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h2>Product not found.</h2>
        <Link to="/store" className="btn-primary" style={{ display: "inline-flex", marginTop: "1rem" }}>Back to Store</Link>
      </div>
    </div>
  );

  const imageUrl = product.image
    ? (product.image.startsWith("http") ? product.image : `http://localhost:8000${product.image}`)
    : "https://via.placeholder.com/600x400?text=No+Image";

  const effectivePrice = parseFloat(product.discount_price || product.price);
  const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price);

  return (
    <div className="page-container">
      <Navbar activePage="store" />
      <div className="page-content animate-slide-up" style={{ padding: "2rem 3rem" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <button onClick={() => navigate("/store")} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontWeight: 700 }}>
            <ArrowLeft size={16} /> {t("store.title") || "Store"}
          </button>
          <span>/</span>
          <span>{(t.language === 'ne' && product.category_name_ne) ? product.category_name_ne : product.category_name}</span>
          <span>/</span>
          <span style={{ color: "var(--text-main)" }}>{(t.language === 'ne' && product.name_ne) ? product.name_ne : product.name}</span>
        </div>

        {/* Main Product Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", marginBottom: "4rem" }}>
          {/* Image */}
          <div style={{ position: "relative" }}>
            <div style={{ borderRadius: "24px", overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--border-light)", aspectRatio: "4/3" }}>
              <img src={imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {/* Badges */}
            <div style={{ position: "absolute", top: "1rem", left: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {product.is_featured && <span style={{ background: "#f59e0b", color: "white", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>⭐ FEATURED</span>}
              {product.is_organic && <span style={{ background: "var(--primary)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>🌿 ORGANIC</span>}
              {hasDiscount && <span style={{ background: "#ef4444", color: "white", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>SALE</span>}
            </div>
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                {(t.language === 'ne' && product.category_name_ne) ? product.category_name_ne : product.category_name}
              </div>
              <h1 style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--secondary)", margin: 0, lineHeight: 1.2 }}>
                {(t.language === 'ne' && product.name_ne) ? product.name_ne : product.name}
              </h1>
              {product.sku && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>SKU: {product.sku}</div>}
            </div>

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.2rem" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill={i < Math.round(product.average_rating) ? "#f59e0b" : "none"} color="#f59e0b" />
                ))}
              </div>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{product.average_rating} ({product.review_count} reviews)</span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--primary)" }}>NPR {effectivePrice.toLocaleString()}</span>
              {hasDiscount && <span style={{ fontSize: "1.25rem", color: "var(--text-muted)", textDecoration: "line-through" }}>NPR {parseFloat(product.price).toLocaleString()}</span>}
            </div>

            {/* Tags */}
            {product.tag_list?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {product.tag_list.map(tag => (
                  <span key={tag} style={{ padding: "0.3rem 0.75rem", background: "var(--primary-subtle)", color: "var(--primary)", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700 }}>{tag}</span>
                ))}
              </div>
            )}

            {/* Stock */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: "12px", background: product.stock > 0 ? "var(--primary-subtle)" : "#fef2f2", border: `1px solid ${product.stock > 0 ? "var(--primary)" : "#fca5a5"}` }}>
              {product.stock > 0 ? <CheckCircle size={18} color="var(--primary)" /> : <Package size={18} color="#ef4444" />}
              <span style={{ fontWeight: 700, color: product.stock > 0 ? "var(--primary)" : "#ef4444", fontSize: "0.9rem" }}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
              </span>
              {product.is_low_stock && product.stock > 0 && <span style={{ fontSize: "0.75rem", color: "#f59e0b", marginLeft: "0.5rem" }}>⚠️ Low Stock</span>}
            </div>

            {/* Quantity & Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <label style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-muted)" }}>Quantity:</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0", border: "1px solid var(--border-light)", borderRadius: "12px", overflow: "hidden" }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: "44px", height: "44px", background: "var(--bg-main)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronDown size={16} />
                  </button>
                  <span style={{ width: "44px", textAlign: "center", fontWeight: 800 }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} style={{ width: "44px", height: "44px", background: "var(--bg-main)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronUp size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="btn-primary"
                  style={{ flex: 1, height: "54px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}
                >
                  <ShoppingCart size={20} />
                  {added ? "Added! ✓" : `Add ${quantity > 1 ? `${quantity}x ` : ""}to Cart`}
                </button>
                <button
                  onClick={handleWishlistToggle}
                  style={{ width: "54px", height: "54px", borderRadius: "14px", border: "1px solid var(--border-light)", background: wishlisted ? "#fee2e2" : "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={22} fill={wishlisted ? "#ef4444" : "none"} color={wishlisted ? "#ef4444" : "var(--text-muted)"} />
                </button>
              </div>
              <button
                onClick={() => navigate("/checkout", { state: { directBuyProduct: { ...product, quantity } } })}
                className="btn-secondary"
                style={{ textAlign: "center", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", height: "48px", width: "100%", cursor: "pointer", border: "none" }}
              >
                <ShoppingBag size={18} /> Buy Now — Go to Checkout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", gap: "0", borderBottom: "2px solid var(--border-light)", marginBottom: "2rem" }}>
            {[
              { key: "description", label: "Description" },
              { key: "usage", label: "Usage Instructions" },
              { key: "reviews", label: `Reviews (${product.review_count})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "0.75rem 1.5rem", border: "none", background: "transparent", cursor: "pointer",
                  fontWeight: 800, fontSize: "0.9rem", color: activeTab === tab.key ? "var(--primary)" : "var(--text-muted)",
                  borderBottom: activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                  marginBottom: "-2px", transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1rem", maxWidth: "700px" }}>
              {(t.language === 'ne' && product.description_ne) ? product.description_ne : product.description}
            </div>
          )}

          {activeTab === "usage" && (
            <div style={{ color: "var(--text-secondary)", lineHeight: 1.8, maxWidth: "700px" }}>
              {(t.language === 'ne' && product.usage_instructions_ne) ? product.usage_instructions_ne : (product.usage_instructions || t("store.noInstructions") || "No instructions available.")}
            </div>
          )}

          {activeTab === "reviews" && (
            <div style={{ maxWidth: "720px" }}>
              {/* Existing Reviews */}
              {reviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{ padding: "1.5rem", background: "var(--bg-card)", borderRadius: "20px", border: "1px solid var(--border-light)", transition: "box-shadow 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,var(--primary),#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: "1rem" }}>
                            {review.user_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.95rem" }}>{review.user_name}</div>
                            <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
                              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} fill={i <= review.rating ? "#f59e0b" : "none"} color="#f59e0b" />)}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{new Date(review.created_at).toLocaleDateString()}</div>
                      </div>
                      {review.comment && <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, fontSize: "0.9rem", paddingLeft: "0.25rem" }}>"{review.comment}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "var(--bg-card)", borderRadius: "20px", border: "1px dashed var(--border-light)", marginBottom: "2.5rem" }}>
                  <Star size={36} style={{ opacity: 0.2, marginBottom: "0.75rem" }} />
                  <p style={{ color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>No reviews yet. Be the first to share your experience!</p>
                </div>
              )}

              {/* Write / Update Review */}
              {isLoggedIn && (
                <div style={{ padding: "2rem", background: "var(--bg-card)", borderRadius: "24px", border: "1px solid var(--border-light)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "12px", background: "linear-gradient(135deg,#f59e0b22,#f59e0b44)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Star size={20} color="#f59e0b" fill="#f59e0b" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.1rem", color: "var(--text-main)" }}>
                        {existingReviewId ? "Update Your Review" : "Write a Review"}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {existingReviewId ? "Your review is already posted. You can update it below." : "Share your honest experience with others."}
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleSubmitReview}>
                    {/* Star Rating Selector */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Your Rating *</label>
                      <div style={{ display: "flex", gap: "0.6rem" }}>
                        {[1, 2, 3, 4, 5].map(r => (
                          <button
                            type="button" key={r}
                            onClick={() => setNewReview(prev => ({ ...prev, rating: r }))}
                            onMouseEnter={() => setHoverRating(r)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", borderRadius: "8px", transition: "transform 0.15s", transform: (hoverRating || newReview.rating) >= r ? "scale(1.15)" : "scale(1)" }}
                          >
                            <Star size={36} fill={(hoverRating || newReview.rating) >= r ? "#f59e0b" : "none"} color={(hoverRating || newReview.rating) >= r ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
                          </button>
                        ))}
                        {newReview.rating > 0 && (
                          <span style={{ alignSelf: "center", marginLeft: "0.5rem", fontWeight: 800, fontSize: "0.9rem", color: "#f59e0b" }}>
                            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][newReview.rating]}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Comment */}
                    <div style={{ marginBottom: "1.25rem" }}>
                      <label style={{ display: "block", fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Your Comments <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                      <textarea
                        value={newReview.comment}
                        onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                        style={{ width: "100%", padding: "1rem", borderRadius: "14px", border: "1.5px solid var(--border-light)", background: "var(--bg-main)", resize: "vertical", color: "var(--text-main)", fontSize: "0.95rem", lineHeight: 1.6, outline: "none", transition: "border 0.2s", fontFamily: "inherit", boxSizing: "border-box" }}
                        placeholder="What did you like or dislike? How was the quality? Would you recommend it?"
                        onFocus={e => e.target.style.borderColor = "var(--primary)"}
                        onBlur={e => e.target.style.borderColor = "var(--border-light)"}
                      />
                    </div>
                    {/* Success & Error */}
                    {reviewSuccess && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: "#d1fae5", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #6ee7b7" }}>
                        <CheckCircle size={18} color="#059669" />
                        <span style={{ color: "#059669", fontWeight: 700, fontSize: "0.9rem" }}>
                          {existingReviewId ? "Your review has been updated successfully!" : "Review submitted successfully!"}
                        </span>
                      </div>
                    )}
                    {reviewError && (
                      <div style={{ padding: "0.875rem 1rem", background: "#fef2f2", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #fca5a5" }}>
                        <p style={{ color: "#dc2626", fontSize: "0.875rem", margin: 0, fontWeight: 600 }}>⚠️ {reviewError}</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary"
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 2rem", fontSize: "0.95rem", fontWeight: 800 }}
                    >
                      <Star size={18} fill="white" />
                      {submittingReview ? "Submitting..." : existingReviewId ? "Update Review" : "Submit Review"}
                    </button>
                  </form>
                </div>
              )}
              {!isLoggedIn && (
                <div style={{ textAlign: "center", padding: "2rem", background: "var(--bg-card)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
                  <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>Please sign in to write a review.</p>
                  <button onClick={() => navigate("/")} className="btn-primary" style={{ display: "inline-flex", gap: "0.5rem" }}>Sign In to Review</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontWeight: 900, marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Leaf size={24} color="var(--primary)" /> Related Products
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {related.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/store/product/${p.id}`)}
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "20px", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-xl)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ height: "160px", overflow: "hidden" }}>
                    <img src={p.image ? (p.image.startsWith("http") ? p.image : `http://localhost:8000${p.image}`) : "https://via.placeholder.com/220x160"} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "1rem" }}>
                    <p style={{ fontWeight: 800, margin: "0 0 0.25rem", fontSize: "0.95rem", color: "var(--text-main)" }}>{p.name}</p>
                    <p style={{ color: "var(--primary)", fontWeight: 900, margin: 0 }}>NPR {parseFloat(p.effective_price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
