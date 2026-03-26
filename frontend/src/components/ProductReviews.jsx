import { useState, useEffect } from "react";
import { Star, Send, Trash2, Edit2, X, Check } from "lucide-react";
import { eCommerceService } from "../services/api";

const StarRating = ({ value, onChange, readonly = false }) => {
    const [hover, setHover] = useState(0);
    return (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && onChange && onChange(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                    style={{
                        background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer',
                        padding: '0.1rem', color: (hover || value) >= star ? '#f59e0b' : 'var(--border-light)',
                        transition: 'color 0.15s', fontSize: '1.1rem'
                    }}
                >
                    ★
                </button>
            ))}
        </div>
    );
};

const ProductReviews = ({ productId, productName }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    const currentUser = sessionStorage.getItem('username');

    const loadReviews = async () => {
        try {
            const res = await eCommerceService.getReviews(productId);
            setReviews(res.data.results || res.data);
        } catch (e) {
            console.error('Error loading reviews:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) loadReviews();
    }, [productId]);

    const average = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (editingId) {
                await eCommerceService.updateReview(editingId, { rating, comment });
            } else {
                await eCommerceService.submitReview({ product: productId, rating, comment });
            }
            setShowForm(false);
            setEditingId(null);
            setRating(5);
            setComment('');
            await loadReviews();
        } catch (e) {
            setError(e.response?.data?.non_field_errors?.[0] || 'You have already reviewed this product.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete your review?')) return;
        await eCommerceService.deleteReview(id);
        await loadReviews();
    };

    const handleEdit = (review) => {
        setEditingId(review.id);
        setRating(review.rating);
        setComment(review.comment);
        setShowForm(true);
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Star size={20} style={{ color: '#f59e0b' }} />
                        Customer Reviews
                        <span style={{ background: 'var(--bg-surface-inner)', padding: '0.2rem 0.75rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700 }}>
                            {reviews.length}
                        </span>
                    </h3>
                    {reviews.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <StarRating value={Math.round(average)} readonly />
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f59e0b' }}>{average}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>out of 5</span>
                        </div>
                    )}
                </div>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setRating(5); setComment(''); }}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
                    >
                        <Edit2 size={14} /> Write a Review
                    </button>
                )}
            </div>

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: 'var(--bg-surface-inner)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>{editingId ? 'Edit Your Review' : 'Write a Review'}</h4>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Your Rating</label>
                        <StarRating value={rating} onChange={setRating} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Comment (optional)</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={3}
                            placeholder="Share your experience with this product..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </div>
                    {error && <p style={{ color: 'var(--danger)', margin: '0 0 1rem 0', fontSize: '0.85rem' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
                            <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading reviews...</div>
            ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-surface-inner)', borderRadius: '16px', color: 'var(--text-muted)' }}>
                    <Star size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0 }}>No reviews yet. Be the first to review!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reviews.map(review => (
                        <div key={review.id} style={{ padding: '1.25rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                        {review.user_name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700 }}>{review.user_name}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <StarRating value={review.rating} readonly />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {review.user_name === currentUser && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(review)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.25rem' }}>
                                            <Edit2 size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(review.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {review.comment && (
                                <p style={{ margin: '0.75rem 0 0 3rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductReviews;
