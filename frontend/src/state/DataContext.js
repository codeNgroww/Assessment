import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchItems = useCallback(async (page = 1, limit = 10, search = '', isActive = () => true) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search.trim()) {
        params.append('q', search.trim());
      }
      
      const res = await fetch(`http://localhost:3001/api/items?${params}`);
      const json = await res.json();
      
      // Only update state if component is still mounted
      if (isActive()) {
        setItems(json.items);
        setPagination(json.pagination);
        setSearchTerm(search);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  }, []);

  return (
    <DataContext.Provider value={{ 
      items, 
      pagination, 
      loading, 
      searchTerm, 
      fetchItems,
      setSearchTerm 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);