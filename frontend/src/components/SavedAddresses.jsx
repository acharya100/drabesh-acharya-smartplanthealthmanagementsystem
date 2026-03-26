import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Star, Home, Briefcase, Check } from "lucide-react";
import { eCommerceService } from "../services/api";

const SavedAddresses = ({ selectedId, onSelect }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [label, setLabel] = useState('Home');
    const [phone, setPhone] = useState('');
    const [fullAddress, setFullAddress] = useState('');
    const [saving, setSaving] = useState(false);

    const loadAddresses = async () => {
        try {
            const res = await eCommerceService.getAddresses();
            const data = res.data.results || res.data;
            setAddresses(data);
            // Auto-select default
            if (!selectedId) {
                const def = data.find(a => a.is_default);
                if (def) onSelect?.(def);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAddresses(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await eCommerceService.saveAddress({ label, phone, full_address: fullAddress, is_default: addresses.length === 0 });
            setShowForm(false);
            setPhone(''); setFullAddress(''); setLabel('Home');
            await loadAddresses();
            onSelect?.(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Remove this address?')) return;
        await eCommerceService.deleteAddress(id);
        setAddresses(prev => prev.filter(a => a.id !== id));
        if (selectedId?.id === id) onSelect?.(null);
    };

    const labelIcon = (l) => l === 'Home' ? <Home size={14} /> : l === 'Office' ? <Briefcase size={14} /> : <MapPin size={14} />;

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                <MapPin size={18} className="text-primary" /> Saved Addresses
            </h4>

            {loading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading addresses...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                    {addresses.map(addr => (
                        <div
                            key={addr.id}
                            onClick={() => onSelect?.(addr)}
                            style={{
                                padding: '1rem 1.25rem', borderRadius: '14px', cursor: 'pointer',
                                border: `2px solid ${selectedId?.id === addr.id ? 'var(--primary)' : 'var(--border-light)'}`,
                                background: selectedId?.id === addr.id ? 'var(--primary-subtle)' : 'var(--bg-card)',
                                transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    {labelIcon(addr.label)}
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{addr.label}</span>
                                    {addr.is_default && (
                                        <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '99px' }}>DEFAULT</span>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{addr.full_address}</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {addr.phone}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {selectedId?.id === addr.id && <Check size={18} style={{ color: 'var(--primary)' }} />}
                                <button onClick={(e) => handleDelete(addr.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!showForm ? (
                <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '2px dashed var(--border-light)', borderRadius: '14px', padding: '0.75rem 1.25rem', cursor: 'pointer', color: 'var(--text-muted)', width: '100%', justifyContent: 'center', fontWeight: 600, transition: 'all 0.2s' }}>
                    <Plus size={16} /> Add New Address
                </button>
            ) : (
                <form onSubmit={handleSave} style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-inner)' }}>
                    <h5 style={{ margin: '0 0 1rem 0' }}>New Address</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Label</label>
                            <select value={label} onChange={e => setLabel(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
                                <option>Home</option>
                                <option>Office</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Phone</label>
                            <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="98XXXXXXXX" style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Full Address</label>
                        <textarea required value={fullAddress} onChange={e => setFullAddress(e.target.value)} rows={2} placeholder="Street, City, District..." style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
                            {saving ? 'Saving...' : 'Save Address'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SavedAddresses;
