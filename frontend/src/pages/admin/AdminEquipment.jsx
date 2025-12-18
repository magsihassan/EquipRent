import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getImageUrl } from '../../services/api';
import { Package, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './Admin.css';

export default function AdminEquipment() {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchPendingEquipment();
    }, []);

    const fetchPendingEquipment = async () => {
        try {
            const response = await adminAPI.getPendingEquipment();
            setEquipment(response.data.data);
        } catch (error) {
            toast.error('Failed to load equipment');
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (id, isApproved, reason = '') => {
        setActionLoading(id);
        try {
            // Backend expects 'approved' and 'notes'
            await adminAPI.approveEquipment(id, { approved: isApproved, notes: reason });
            toast.success(`Equipment ${isApproved ? 'approved' : 'rejected'}`);
            setEquipment(equipment.filter(eq => eq.id !== id));
        } catch (error) {
            toast.error('Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" size={40} />
            </div>
        );
    }

    return (
        <div className="admin-equipment-page">
            <div className="page-header">
                <div>
                    <h1>Equipment Approval</h1>
                    <p>Review and approve new equipment listings</p>
                </div>
            </div>

            {equipment.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <CheckCircle size={40} />
                    </div>
                    <h3>All caught up!</h3>
                    <p>No pending equipment to review</p>
                </div>
            ) : (
                <div className="approval-list">
                    {equipment.map((item) => (
                        <div key={item.id} className="approval-card">
                            <div className="approval-image">
                                {item.primary_image ? (
                                    <img src={getImageUrl(item.primary_image)} alt={item.title} />
                                ) : (
                                    <div className="no-image">
                                        <Package size={40} />
                                    </div>
                                )}
                            </div>
                            <div className="approval-content">
                                <div className="approval-header">
                                    <h3>{item.title}</h3>
                                    <span className="category-badge">{item.category_name}</span>
                                </div>
                                <p className="approval-desc">{item.description?.slice(0, 150)}...</p>
                                <div className="approval-meta">
                                    <span>Owner: {item.owner_first_name} {item.owner_last_name}</span>
                                    <span>City: {item.city}</span>
                                    <span>Daily Rate: Rs. {item.daily_rate?.toLocaleString()}</span>
                                </div>
                                <div className="approval-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleApproval(item.id, true)}
                                        disabled={actionLoading === item.id}
                                    >
                                        {actionLoading === item.id ? <Loader2 className="spinner" size={16} /> : <><CheckCircle size={16} /> Approve</>}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleApproval(item.id, false, 'Does not meet requirements')}
                                        disabled={actionLoading === item.id}
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                    <Link to={`/equipment/${item.id}`} className="btn btn-ghost">
                                        <Eye size={16} /> View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
