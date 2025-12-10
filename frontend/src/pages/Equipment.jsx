import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEquipmentStore } from '../store';
import {
    Search, Filter, MapPin, Star, X, ChevronDown, Grid, List, Truck, Loader2
} from 'lucide-react';
import './Equipment.css';

const API_URL = 'http://localhost:5000';

export default function Equipment() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);

    const {
        equipment, categories, pagination, isLoading,
        fetchEquipment, fetchCategories, filters, setFilters
    } = useEquipmentStore();

    const [localFilters, setLocalFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        city: searchParams.get('city') || '',
        minPrice: '',
        maxPrice: '',
        hasOperator: false
    });

    useEffect(() => {
        fetchCategories();
        fetchEquipment({
            search: searchParams.get('search') || '',
            category: searchParams.get('category') || ''
        });
    }, []);

    const handleSearch = () => {
        setFilters(localFilters);
        fetchEquipment({ page: 1, ...localFilters });
    };

    const handlePageChange = (page) => {
        fetchEquipment({ page, ...filters });
    };

    const clearFilters = () => {
        const cleared = {
            search: '',
            category: '',
            city: '',
            minPrice: '',
            maxPrice: '',
            hasOperator: false
        };
        setLocalFilters(cleared);
        setFilters(cleared);
        fetchEquipment({ page: 1 });
    };

    return (
        <div className="equipment-page">
            <div className="container">
                {/* Search Header */}
                <div className="search-header">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search equipment..."
                            value={localFilters.search}
                            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button className="btn btn-primary" onClick={handleSearch}>
                            Search
                        </button>
                    </div>

                    <div className="search-actions">
                        <button
                            className={`filter-toggle ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={18} />
                            Filters
                        </button>
                        <div className="view-toggle">
                            <button
                                className={viewMode === 'grid' ? 'active' : ''}
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                className={viewMode === 'list' ? 'active' : ''}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Category</label>
                            <select
                                value={localFilters.category}
                                onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value })}
                                className="input"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>City</label>
                            <select
                                value={localFilters.city}
                                onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value })}
                                className="input"
                            >
                                <option value="">All Cities</option>
                                <option value="Lahore">Lahore</option>
                                <option value="Karachi">Karachi</option>
                                <option value="Islamabad">Islamabad</option>
                                <option value="Rawalpindi">Rawalpindi</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Min Price (Rs/day)</label>
                            <input
                                type="number"
                                value={localFilters.minPrice}
                                onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                                className="input"
                                placeholder="0"
                            />
                        </div>

                        <div className="filter-group">
                            <label>Max Price (Rs/day)</label>
                            <input
                                type="number"
                                value={localFilters.maxPrice}
                                onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                                className="input"
                                placeholder="100000"
                            />
                        </div>

                        <div className="filter-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={localFilters.hasOperator}
                                    onChange={(e) => setLocalFilters({ ...localFilters, hasOperator: e.target.checked })}
                                />
                                With Operator
                            </label>
                        </div>

                        <div className="filter-actions">
                            <button className="btn btn-primary" onClick={handleSearch}>
                                Apply Filters
                            </button>
                            <button className="btn btn-ghost" onClick={clearFilters}>
                                Clear All
                            </button>
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="results-header">
                    <span className="results-count">
                        {pagination.total} equipment found
                    </span>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <Loader2 className="spinner" size={40} />
                        <p>Loading equipment...</p>
                    </div>
                ) : equipment.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Truck size={40} />
                        </div>
                        <h3>No equipment found</h3>
                        <p>Try adjusting your filters or search terms</p>
                        <button className="btn btn-primary" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className={`equipment-results ${viewMode}`}>
                        {equipment.map((item) => (
                            <Link key={item.id} to={`/equipment/${item.id}`} className="equipment-card">
                                <div className="equipment-image">
                                    {item.primary_image ? (
                                        <img src={`${API_URL}${item.primary_image}`} alt={item.title} />
                                    ) : (
                                        <div className="no-image">
                                            <Truck size={40} />
                                        </div>
                                    )}
                                    {item.has_operator && (
                                        <span className="badge badge-primary operator-badge">With Operator</span>
                                    )}
                                    <span className={`badge availability-badge ${item.available_quantity > 0 ? 'badge-available' : 'badge-unavailable'}`}>
                                        {item.available_quantity > 0
                                            ? `${item.available_quantity} Available`
                                            : 'Unavailable'
                                        }
                                    </span>
                                </div>
                                <div className="equipment-info">
                                    <div className="equipment-category">{item.category_name}</div>
                                    <h3>{item.title}</h3>
                                    <div className="equipment-meta">
                                        <span className="location">
                                            <MapPin size={14} /> {item.city}
                                        </span>
                                        {item.average_rating > 0 && (
                                            <span className="rating">
                                                <Star size={14} className="star filled" /> {Number(item.average_rating).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="equipment-specs">
                                        {item.brand && <span>{item.brand}</span>}
                                        {item.model && <span>{item.model}</span>}
                                        {item.model_year && <span>{item.model_year}</span>}
                                    </div>
                                    <div className="equipment-footer">
                                        <div className="price">
                                            <span className="amount">Rs. {item.daily_rate?.toLocaleString()}</span>
                                            <span className="period">/ day</span>
                                        </div>
                                        <span className="view-btn">View Details</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            Previous
                        </button>
                        {[...Array(pagination.pages)].map((_, i) => (
                            <button
                                key={i}
                                className={`pagination-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                                onClick={() => handlePageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            className="pagination-btn"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
