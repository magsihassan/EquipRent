import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipmentAPI } from '../../services/api';
import { useEquipmentStore } from '../../store';
import { Upload, X, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import './Owner.css';

export default function AddEquipment() {
    const navigate = useNavigate();
    const { categories, fetchCategories } = useEquipmentStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        brand: '',
        model: '',
        modelYear: '',
        dailyRate: '',
        weeklyRate: '',
        monthlyRate: '',
        city: '',
        address: '',
        hasOperator: false,
        operatorRatePerDay: '',
        hasTransportation: false,
        autoApproveBookings: false,
        specifications: {},
        quantity: 1
    });
    const [images, setImages] = useState([]);
    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }
        setImages([...images, ...files]);
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const addSpecification = () => {
        if (specKey && specValue) {
            setFormData({
                ...formData,
                specifications: { ...formData.specifications, [specKey]: specValue }
            });
            setSpecKey('');
            setSpecValue('');
        }
    };

    const removeSpecification = (key) => {
        const specs = { ...formData.specifications };
        delete specs[key];
        setFormData({ ...formData, specifications: specs });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.categoryId || !formData.dailyRate || !formData.city) {
            toast.error('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            // Prepare data - convert empty strings to null for numeric fields
            const dataToSend = {
                ...formData,
                modelYear: formData.modelYear === '' ? null : formData.modelYear,
                dailyRate: formData.dailyRate === '' ? null : formData.dailyRate,
                weeklyRate: formData.weeklyRate === '' ? null : formData.weeklyRate,
                monthlyRate: formData.monthlyRate === '' ? null : formData.monthlyRate,
                operatorRatePerDay: formData.operatorRatePerDay === '' ? null : formData.operatorRatePerDay,
            };

            // Create equipment
            const response = await equipmentAPI.create(dataToSend);
            const equipmentId = response.data.data.id;

            // Upload images
            if (images.length > 0) {
                const imageFormData = new FormData();
                images.forEach(img => imageFormData.append('images', img));
                await equipmentAPI.uploadImages(equipmentId, imageFormData);
            }

            toast.success('Equipment added successfully!');
            navigate('/my-equipment');
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to add equipment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-equipment-page">
            <div className="page-header">
                <h1>Add New Equipment</h1>
                <p>List your equipment for rent</p>
            </div>

            <form onSubmit={handleSubmit} className="equipment-form">
                {/* Basic Info */}
                <div className="form-section">
                    <h2>Basic Information</h2>
                    <div className="form-grid">
                        <div className="input-group full-width">
                            <label>Title *</label>
                            <input
                                name="title"
                                className="input"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., CAT 320 Excavator"
                                required
                            />
                        </div>

                        <div className="input-group full-width">
                            <label>Description</label>
                            <textarea
                                name="description"
                                className="input"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your equipment..."
                                rows={4}
                            />
                        </div>

                        <div className="input-group">
                            <label>Category *</label>
                            <select
                                name="categoryId"
                                className="input"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Brand</label>
                            <input
                                name="brand"
                                className="input"
                                value={formData.brand}
                                onChange={handleChange}
                                placeholder="e.g., Caterpillar"
                            />
                        </div>

                        <div className="input-group">
                            <label>Model</label>
                            <input
                                name="model"
                                className="input"
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="e.g., 320"
                            />
                        </div>

                        <div className="input-group">
                            <label>Model Year</label>
                            <input
                                name="modelYear"
                                type="number"
                                className="input"
                                value={formData.modelYear}
                                onChange={handleChange}
                                placeholder="e.g., 2021"
                            />
                        </div>

                        <div className="input-group">
                            <label>Quantity *</label>
                            <input
                                name="quantity"
                                type="number"
                                className="input"
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="e.g., 1"
                                min="1"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="form-section">
                    <h2>Pricing</h2>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Daily Rate (Rs.) *</label>
                            <input
                                name="dailyRate"
                                type="number"
                                className="input"
                                value={formData.dailyRate}
                                onChange={handleChange}
                                placeholder="e.g., 50000"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Weekly Rate (Rs.)</label>
                            <input
                                name="weeklyRate"
                                type="number"
                                className="input"
                                value={formData.weeklyRate}
                                onChange={handleChange}
                                placeholder="e.g., 300000"
                            />
                        </div>

                        <div className="input-group">
                            <label>Monthly Rate (Rs.)</label>
                            <input
                                name="monthlyRate"
                                type="number"
                                className="input"
                                value={formData.monthlyRate}
                                onChange={handleChange}
                                placeholder="e.g., 1000000"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="form-section">
                    <h2>Location</h2>
                    <div className="form-grid">
                        <div className="input-group">
                            <label>City *</label>
                            <select
                                name="city"
                                className="input"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select city</option>
                                <option value="Lahore">Lahore</option>
                                <option value="Karachi">Karachi</option>
                                <option value="Islamabad">Islamabad</option>
                                <option value="Rawalpindi">Rawalpindi</option>
                                <option value="Faisalabad">Faisalabad</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Address</label>
                            <input
                                name="address"
                                className="input"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Street address"
                            />
                        </div>
                    </div>
                </div>

                {/* Options */}
                <div className="form-section">
                    <h2>Options</h2>
                    <div className="options-grid">
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                name="hasOperator"
                                checked={formData.hasOperator}
                                onChange={handleChange}
                            />
                            <div className="checkbox-content">
                                <span className="checkbox-title">Operator Available</span>
                                <span className="checkbox-desc">You can provide a trained operator</span>
                            </div>
                        </label>

                        {formData.hasOperator && (
                            <div className="input-group">
                                <label>Operator Rate per Day (Rs.)</label>
                                <input
                                    name="operatorRatePerDay"
                                    type="number"
                                    className="input"
                                    value={formData.operatorRatePerDay}
                                    onChange={handleChange}
                                    placeholder="e.g., 5000"
                                />
                            </div>
                        )}

                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                name="hasTransportation"
                                checked={formData.hasTransportation}
                                onChange={handleChange}
                            />
                            <div className="checkbox-content">
                                <span className="checkbox-title">Transportation Service</span>
                                <span className="checkbox-desc">You can deliver the equipment</span>
                            </div>
                        </label>

                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                name="autoApproveBookings"
                                checked={formData.autoApproveBookings}
                                onChange={handleChange}
                            />
                            <div className="checkbox-content">
                                <span className="checkbox-title">Auto-approve Bookings</span>
                                <span className="checkbox-desc">Automatically accept booking requests</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Images */}
                <div className="form-section">
                    <h2>Images</h2>
                    <div className="image-upload-area">
                        <input
                            type="file"
                            id="images"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            hidden
                        />
                        <label htmlFor="images" className="upload-zone">
                            <Upload size={32} />
                            <span>Click to upload images</span>
                            <span className="upload-hint">Maximum 5 images, JPG or PNG</span>
                        </label>
                    </div>

                    {images.length > 0 && (
                        <div className="image-preview-grid">
                            {images.map((img, i) => (
                                <div key={i} className="image-preview">
                                    <img src={URL.createObjectURL(img)} alt={`Preview ${i}`} />
                                    <button type="button" className="remove-image" onClick={() => removeImage(i)}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Specifications */}
                <div className="form-section">
                    <h2>Specifications (Optional)</h2>
                    <div className="spec-input-row">
                        <input
                            className="input"
                            placeholder="Key (e.g., Engine Power)"
                            value={specKey}
                            onChange={(e) => setSpecKey(e.target.value)}
                        />
                        <input
                            className="input"
                            placeholder="Value (e.g., 150 HP)"
                            value={specValue}
                            onChange={(e) => setSpecValue(e.target.value)}
                        />
                        <button type="button" className="btn btn-secondary" onClick={addSpecification}>
                            <Plus size={18} />
                        </button>
                    </div>

                    {Object.keys(formData.specifications).length > 0 && (
                        <div className="specs-list">
                            {Object.entries(formData.specifications).map(([key, value]) => (
                                <div key={key} className="spec-tag">
                                    <span>{key}: {value}</span>
                                    <button type="button" onClick={() => removeSpecification(key)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <><Loader2 className="spinner" /> Adding...</> : 'Add Equipment'}
                    </button>
                </div>
            </form>
        </div>
    );
}
