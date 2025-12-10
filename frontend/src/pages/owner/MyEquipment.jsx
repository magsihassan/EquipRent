import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { equipmentAPI } from '../../services/api';
import { Package, Plus, Edit, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './Owner.css';

const API_URL = 'http://localhost:5000';

export default function MyEquipment() {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyEquipment();
    }, []);

    const fetchMyEquipment = async () => {
        try {
            const response = await equipmentAPI.getMyEquipment();
            setEquipment(response.data.data);
        } catch (error) {
            toast.error('Failed to load equipment');
        } finally {
            setLoading(false);
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
        <div className="my-equipment-page">
            <div className="page-header">
                <div>
                    <h1>My Equipment</h1>
                    <p>Manage your equipment listings</p>
                </div>
                <Link to="/add-equipment" className="btn btn-primary">
                    <Plus size={18} /> Add Equipment
                </Link>
            </div>

            {equipment.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Package size={40} />
                    </div>
                    <h3>No equipment listed yet</h3>
                    <p>Start earning by listing your construction equipment</p>
                    <Link to="/add-equipment" className="btn btn-primary">
                        Add Your First Equipment
                    </Link>
                </div>
            ) : (
                <div className="equipment-table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>Category</th>
                                <th>Daily Rate</th>
                                <th>Status</th>
                                <th>Quantity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="equipment-cell">
                                            <div className="equipment-thumb">
                                                {item.primary_image ? (
                                                    <img src={`${API_URL}${item.primary_image}`} alt={item.title} />
                                                ) : (
                                                    <Package size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <span className="equipment-title">{item.title}</span>
                                                <span className="equipment-location">{item.city}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{item.category_name}</td>
                                    <td>Rs. {item.daily_rate?.toLocaleString()}</td>
                                    <td>
                                        <span className={`badge ${item.is_approved ? 'badge-success' : 'badge-warning'}`}>
                                            {item.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="quantity-info">
                                            <span className={item.available_quantity > 0 ? 'available' : 'unavailable'}>
                                                {item.available_quantity > 0
                                                    ? `${item.available_quantity} of ${item.quantity} available`
                                                    : 'All units rented'
                                                }
                                            </span>
                                            <small>{item.rented_quantity} rented</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link to={`/equipment/${item.id}`} className="action-btn view">
                                                <Eye size={16} />
                                            </Link>
                                            <Link to={`/edit-equipment/${item.id}`} className="action-btn edit">
                                                <Edit size={16} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
