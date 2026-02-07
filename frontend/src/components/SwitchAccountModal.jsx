/**
 * Switch Account Modal
 */
import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
            sessionStorage.setItem("access_token", data.access);
            sessionStorage.setItem("refresh_token", data.refresh);
            sessionStorage.setItem("username", data.username);
            sessionStorage.setItem("isAuthenticated", "true");

            // Reload to apply new user context across the app
            window.location.reload();
        } catch (err) {
            setError("Failed to switch account.");
            setSwitchingId(null);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose} style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div
                className="modal-content animate-slide-up"
                style={{
                    maxWidth: '500px',
                    width: '90%',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'calc(100vh - 4rem)', /* Prevent cut-off */
                    position: 'relative',
                    margin: '0 auto', /* Centering safety */
                    border: '1px solid var(--border-light)' /* High contrast border */
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="status-pill" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '12px' }}>
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>Switch Identity</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Select an account to continue</p>
                        </div>
                    </div>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        title="Close"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            borderRadius: '50%',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--danger)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <RefreshCw className="animate-spin text-primary" size={32} style={{ margin: '0 auto' }} />
                            <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading accounts...</p>
                        </div>
                    ) : (
                        <div className="account-list" style={{ display: 'flex', flexDirection: 'column' }}>
                            {users.map((user, index) => (
                                <div
                                    key={user.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1.25rem 1.5rem',
                                        background: user.username === currentUsername ? 'var(--primary-subtle)' : 'transparent',
                                        borderBottom: index !== users.length - 1 ? '1px solid var(--border-light)' : 'none',
                                        transition: 'background 0.2s'
                                    }}
                                    className="account-item-hover"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px',
                                            background: user.username === currentUsername ? 'var(--primary)' : 'var(--bg-main)',
                                            color: user.username === currentUsername ? 'white' : 'var(--text-muted)',
                                            borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: user.username === currentUsername ? 'none' : '1px solid var(--border-light)'
                                        }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{user.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </div>
                                    </div>

                                    {user.username === currentUsername ? (
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            color: 'var(--primary)',
                                            background: 'rgba(255,255,255,0.5)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>Current</span>
                                    ) : (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', minWidth: '80px' }}
                                            onClick={() => handleSwitch(user.id)}
                                            disabled={switchingId === user.id}
                                        >
                                            {switchingId === user.id ? "..." : "Switch"}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div style={{ margin: '1rem', color: '#991b1b', fontSize: '0.85rem', textAlign: 'center', background: '#fee2e2', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                            {error}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', padding: '1rem', background: 'var(--bg-main)' }}>
                    <button
                        onClick={onClose}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600 }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SwitchAccountModal;
