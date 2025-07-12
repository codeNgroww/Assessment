import React, { useEffect, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

// Skeleton loading component
const SkeletonItem = ({ style }) => (
  <div style={style} className="skeleton-item">
    <div className="skeleton-content">
      <div className="skeleton-name"></div>
      <div className="skeleton-category"></div>
      <div className="skeleton-price"></div>
    </div>
  </div>
);

// Virtualized item component
const ItemRow = React.memo(({ index, style, data }) => {
  const item = data.items[index];
  
  return (
    <div style={style} className="virtualized-item">
      <Link 
        to={'/items/' + item.id} 
        className="item-link"
        aria-label={`View details for ${item.name}, ${item.category}, $${item.price}`}
      >
        <span className="item-name" title={item.name}>{item.name}</span>
        <span className="item-category" aria-label={`Category: ${item.category}`}>
          ({item.category})
        </span>
        <span className="item-price" aria-label={`Price: $${item.price}`}>
          ${item.price.toLocaleString()}
        </span>
      </Link>
    </div>
  );
});

// Virtualized skeleton component for loading states
const SkeletonRow = React.memo(({ index, style }) => (
  <SkeletonItem style={style} />
));

function Items() {
  const { items, pagination, loading, searchTerm, fetchItems, setSearchTerm } = useData();
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Virtualization settings
  const ITEM_HEIGHT = 60;
  const LIST_HEIGHT = 400;

  // Debounce search input
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Fetch items when search term or page changes
  useEffect(() => {
    let active = true;

    fetchItems(pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm, () => active);

    return () => {
      active = false;
    };
  }, [fetchItems, pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setLocalSearchTerm(e.target.value);
  };

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchItems(newPage, pagination.itemsPerPage, debouncedSearchTerm);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    fetchItems(1, newLimit, debouncedSearchTerm);
  };

  // Handle keyboard navigation for pagination
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Memoized row renderer for react-window
  const rowRenderer = useCallback(({ index, style }) => (
    <ItemRow index={index} style={style} data={{ items }} />
  ), [items]);

  // Memoized skeleton renderer for loading states
  const skeletonRenderer = useCallback(({ index, style }) => (
    <SkeletonRow index={index} style={style} />
  ), []);

  // Show skeleton loading for initial load
  if (loading && items.length === 0) {
    return (
      <div className="items-container">
        <div className="search-section">
          <div className="skeleton-search"></div>
        </div>
        <div className="items-per-page">
          <div className="skeleton-select"></div>
        </div>
        <div className="virtualized-list-container">
          <List
            height={LIST_HEIGHT}
            itemCount={10}
            itemSize={ITEM_HEIGHT}
            width="100%"
          >
            {skeletonRenderer}
          </List>
        </div>
      </div>
    );
  }

  return (
    <div className="items-container">
      {/* Search Section */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search items by name or category..."
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="search-input"
            aria-label="Search items"
            aria-describedby="search-info"
          />
          {isSearching && <div className="search-spinner" aria-hidden="true"></div>}
        </div>
        {searchTerm && (
          <p id="search-info" className="search-info" role="status" aria-live="polite">
            Showing results for "{searchTerm}" ({pagination.totalItems.toLocaleString()} items found)
          </p>
        )}
      </div>

      {/* Items Per Page Selector */}
      <div className="items-per-page">
        <label htmlFor="itemsPerPage" className="items-per-page-label">
          Items per page:
        </label>
        <select
          id="itemsPerPage"
          value={pagination.itemsPerPage}
          onChange={handleItemsPerPageChange}
          className="items-per-page-select"
          aria-label="Select number of items per page"
        >
          <option value={5}>5 items</option>
          <option value={10}>10 items</option>
          <option value={20}>20 items</option>
          <option value={50}>50 items</option>
          <option value={100}>100 items</option>
          <option value={500}>500 items</option>
          <option value={1000}>1000 items</option>
        </select>
      </div>

      {/* Virtualized Items List */}
      {items.length > 0 ? (
        <div className="virtualized-list-container" role="list" aria-label="Items list">
          <List
            height={Math.min(LIST_HEIGHT, items.length * ITEM_HEIGHT)}
            itemCount={items.length}
            itemSize={ITEM_HEIGHT}
            width="100%"
            itemData={{ items }}
            className="virtualized-list"
          >
            {rowRenderer}
          </List>
        </div>
      ) : (
        <div className="no-results" role="status" aria-live="polite">
          <div className="no-results-icon">🔍</div>
          <p>
            {searchTerm ? `No items found for "${searchTerm}"` : 'No items available'}
          </p>
          {searchTerm && (
            <button 
              onClick={() => setLocalSearchTerm('')}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <nav className="pagination" role="navigation" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(pagination.prevPage)}
            onKeyDown={(e) => handleKeyDown(e, () => handlePageChange(pagination.prevPage))}
            disabled={!pagination.hasPrevPage}
            className="pagination-btn pagination-btn-prev"
            aria-label={`Go to previous page, page ${pagination.prevPage}`}
          >
            <span aria-hidden="true">←</span>
            <span className="pagination-btn-text">Previous</span>
          </button>
          
          <div className="pagination-info" aria-live="polite">
            <span className="pagination-current">
              Page {pagination.currentPage.toLocaleString()} of {pagination.totalPages.toLocaleString()}
            </span>
            <span className="pagination-total">
              ({pagination.totalItems.toLocaleString()} total items)
            </span>
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.nextPage)}
            onKeyDown={(e) => handleKeyDown(e, () => handlePageChange(pagination.nextPage))}
            disabled={!pagination.hasNextPage}
            className="pagination-btn pagination-btn-next"
            aria-label={`Go to next page, page ${pagination.nextPage}`}
          >
            <span className="pagination-btn-text">Next</span>
            <span aria-hidden="true">→</span>
          </button>
        </nav>
      )}

      {/* Loading indicator for subsequent requests */}
      {loading && items.length > 0 && (
        <div className="loading-indicator" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <span>Loading more items...</span>
        </div>
      )}

      <style jsx>{`
        .items-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .search-section {
          margin-bottom: 24px;
        }

        .search-input-wrapper {
          position: relative;
          margin-bottom: 12px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          background: white;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .search-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .search-input::placeholder {
          color: #6c757d;
        }

        .search-spinner {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }

        .search-info {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
          padding: 8px 0;
        }

        .items-per-page {
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .items-per-page-label {
          font-weight: 500;
          color: #495057;
        }

        .items-per-page-select {
          padding: 8px 12px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .items-per-page-select:focus {
          outline: none;
          border-color: #007bff;
        }

        .virtualized-list-container {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          margin-bottom: 24px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .virtualized-item {
          border-bottom: 1px solid #f8f9fa;
          display: flex;
          align-items: center;
        }

        .virtualized-item:last-child {
          border-bottom: none;
        }

        .item-link {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-decoration: none;
          color: inherit;
          padding: 12px 16px;
          width: 100%;
          height: 100%;
          transition: all 0.2s ease;
          border-radius: 0;
        }

        .item-link:hover {
          background-color: #f8f9fa;
          transform: translateX(2px);
        }

        .item-link:focus {
          outline: none;
          background-color: #e3f2fd;
          box-shadow: inset 0 0 0 2px #007bff;
        }

        .item-name {
          font-weight: 600;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #212529;
        }

        .item-category {
          color: #6c757d;
          margin: 0 12px;
          flex-shrink: 0;
          font-size: 14px;
        }

        .item-price {
          font-weight: 700;
          color: #28a745;
          flex-shrink: 0;
          font-size: 16px;
        }

        .no-results {
          text-align: center;
          color: #6c757d;
          padding: 60px 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px dashed #dee2e6;
        }

        .no-results-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-results p {
          margin: 0 0 16px 0;
          font-size: 16px;
        }

        .clear-search-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .clear-search-btn:hover {
          background: #0056b3;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 2px solid #e1e5e9;
          background-color: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          min-width: 100px;
          justify-content: center;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: #007bff;
          border-color: #007bff;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .pagination-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .pagination-btn-text {
          font-size: 14px;
        }

        .pagination-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .pagination-current {
          font-weight: 600;
          color: #212529;
        }

        .pagination-total {
          font-size: 12px;
          color: #6c757d;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #6c757d;
          margin-top: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Skeleton Loading Styles */
        .skeleton-item {
          border-bottom: 1px solid #f8f9fa;
          display: flex;
          align-items: center;
        }

        .skeleton-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          width: 100%;
        }

        .skeleton-name {
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          width: 40%;
        }

        .skeleton-category {
          height: 14px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          width: 15%;
        }

        .skeleton-price {
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          width: 10%;
        }

        .skeleton-search {
          height: 48px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .skeleton-select {
          height: 36px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
          width: 120px;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .items-container {
            padding: 16px;
          }

          .pagination {
            flex-direction: column;
            gap: 12px;
          }

          .pagination-btn {
            width: 100%;
            max-width: 200px;
          }

          .item-link {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .item-category {
            margin: 0;
            order: 2;
          }

          .item-price {
            order: 3;
            align-self: flex-end;
          }
        }

        @media (max-width: 480px) {
          .items-per-page {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .search-input {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
}

export default Items;