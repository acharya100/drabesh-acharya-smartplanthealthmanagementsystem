/**
 * Switch Account Modal
 * 
 * Provides a user-friendly interface to browse all registered accounts
 * and switch identities with a single click.
 */
import { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { User, Mail, ShieldCheck, RefreshCw, X } from 'lucide-react';

const SwitchAccountModal = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [switchingId, setSwitchingId] = useState(null);
    const [error, setError] = useState("");

    const currentUsername = localStorage.getItem("username");

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data } = await authService.listUsers();
            setUsers(data);
        } catch (err) {
            setError("Failed to load user list.");
        } finally {
            setLoading(false);
        }
    };

    const handleSwitch = async (userId) => {
        try {
            setSwitchingId(userId);
            const { data } = await authService.switchUser(userId);

            // Update local storage with new session data
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            localStorage.setItem("username", data.username);
            localStorage.setItem("isAuthenticated", "true");

            // Reload to apply new user context across the app
            window.location.reload();
        } catch (err) {
            setError("Failed to switch account.");
            setSwitchingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="status-pill" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '10px' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Switch Identity</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Quickly jump between your accounts</p>
                        </div>
                    </div>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-main)',
                            borderRadius: '8px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 0' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <RefreshCw className="animate-spin text-primary" size={32} />
                            <p className="mt-4">Loading accounts...</p>
                        </div>
                    ) : (
                        <div className="account-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    className={`account-item ${user.username === currentUsername ? 'active' : ''}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1rem 1.5rem',
                                        background: user.username === currentUsername ? 'var(--primary-subtle)' : 'var(--bg-main)',
                                        border: '1px solid',
                                        borderColor: user.username === currentUsername ? 'var(--primary)' : 'var(--border-light)',
                                        borderRadius: 'var(--radius-sm)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '50%', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Mail size={12} /> {user.email}
                                            </div>
                                        </div>
                                    </div>

                                    {user.username === currentUsername ? (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            color: '#fff',
                                            background: 'var(--primary)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            textTransform: 'uppercase'
                                        }}>Current</div>
                                    ) : (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                            onClick={() => handleSwitch(user.id)}
                                            disabled={switchingId === user.id}
                                        >
                                            {switchingId === user.id ? "Switching..." : "Switch"}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', background: '#fee2e2', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                            {error}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ borderTop: 'none', padding: '1rem 1.5rem 2rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.8, textAlign: 'center', fontWeight: 500 }}>
                        Data isolation ensures each identity sees only their own plants.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SwitchAccountModal;
