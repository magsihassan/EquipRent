import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import { User, CheckCircle, XCircle, Shield, Loader2, Eye, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showCnicModal, setShowCnicModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const fetchUsers = async () => {
        try {
            // Translate filter to backend params
            let params = {};
            if (filter === 'renters') {
                params.role = 'renter';
            } else if (filter === 'owners') {
                params.role = 'owner';
            } else if (filter === 'unverified') {
                params.verified = 'false';
            }
            // 'all' sends no filter params

            const response = await adminAPI.getUsers(params);
            setUsers(response.data.data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id, isVerified) => {
        try {
            await adminAPI.verifyUser(id, { isVerified });
            toast.success(`User ${isVerified ? 'verified' : 'unverified'} successfully`);
            fetchUsers();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const openCnicModal = (user) => {
        setSelectedUser(user);
        setShowCnicModal(true);
    };

    const closeCnicModal = () => {
        setSelectedUser(null);
        setShowCnicModal(false);
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" size={40} />
            </div>
        );
    }

    return (
        <div className="admin-users-page">
            <div className="page-header">
                <div>
                    <h1>Manage Users</h1>
                    <p>View and verify user accounts</p>
                </div>
            </div>

            <div className="filters-bar">
                <div className="tabs">
                    {['all', 'renters', 'owners', 'unverified'].map((f) => (
                        <button
                            key={f}
                            className={`tab ${filter === f ? 'active' : ''}`}
                            onClick={() => { setFilter(f); setLoading(true); }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Contact</th>
                            <th>CNIC</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                        </div>
                                        <div>
                                            <span className="user-name">{user.first_name} {user.last_name}</span>
                                            {user.company_name && (
                                                <span className="user-company">{user.company_name}</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge badge-${user.role === 'admin' ? 'primary' : 'gray'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <div className="contact-cell">
                                        <span>{user.email}</span>
                                        {user.phone && <span>{user.phone}</span>}
                                    </div>
                                </td>
                                <td>
                                    {(user.cnic_front_image || user.cnic_back_image) ? (
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => openCnicModal(user)}
                                        >
                                            <Eye size={14} /> View CNIC
                                        </button>
                                    ) : (
                                        <span className="text-muted">Not uploaded</span>
                                    )}
                                </td>
                                <td>
                                    <div className="status-cell">
                                        {user.is_verified ? (
                                            <span className="badge badge-success">
                                                <Shield size={12} /> Verified
                                            </span>
                                        ) : (
                                            <span className="badge badge-warning">Unverified</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                                </td>
                                <td>
                                    {user.role !== 'admin' && (
                                        <button
                                            className={`btn btn-sm ${user.is_verified ? 'btn-secondary' : 'btn-primary'}`}
                                            onClick={() => handleVerify(user.id, !user.is_verified)}
                                        >
                                            {user.is_verified ? 'Unverify' : 'Verify'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CNIC Modal */}
            {showCnicModal && selectedUser && (
                <div className="modal-overlay" onClick={closeCnicModal}>
                    <div className="modal cnic-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>CNIC - {selectedUser.first_name} {selectedUser.last_name}</h3>
                            <button className="modal-close" onClick={closeCnicModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body cnic-images">
                            <div className="cnic-image-container">
                                <h4>Front</h4>
                                {selectedUser.cnic_front_image ? (
                                    <img
                                        src={`http://localhost:5000${selectedUser.cnic_front_image}`}
                                        alt="CNIC Front"
                                        className="cnic-image"
                                    />
                                ) : (
                                    <div className="no-image">
                                        <Image size={40} />
                                        <span>Not uploaded</span>
                                    </div>
                                )}
                            </div>
                            <div className="cnic-image-container">
                                <h4>Back</h4>
                                {selectedUser.cnic_back_image ? (
                                    <img
                                        src={`http://localhost:5000${selectedUser.cnic_back_image}`}
                                        alt="CNIC Back"
                                        className="cnic-image"
                                    />
                                ) : (
                                    <div className="no-image">
                                        <Image size={40} />
                                        <span>Not uploaded</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            {!selectedUser.is_verified && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        handleVerify(selectedUser.id, true);
                                        closeCnicModal();
                                    }}
                                >
                                    <CheckCircle size={16} /> Verify User
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={closeCnicModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
