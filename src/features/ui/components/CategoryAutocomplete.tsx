'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

export interface Category {
  id: string;
  name: string;
}

interface CategoryAutocompleteProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export default function CategoryAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a category...',
  disabled = false,
  className = '',
  label,
}: CategoryAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCreateOption, setShowCreateOption] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 200;

  // Load selected category when value changes
  useEffect(() => {
    const loadSelectedCategory = async () => {
      if (!value) {
        setSelectedCategory(null);
        setQuery('');
        return;
      }

      try {
        const response = await fetch(`/api/categories/${value}`);
        if (response.ok) {
          const category = await response.json();
          setSelectedCategory(category);
          setQuery(category.name);
        } else {
          setSelectedCategory(null);
          setQuery('');
        }
      } catch (err) {
        console.error('Error loading category:', err);
        setSelectedCategory(null);
        setQuery('');
      }
    };

    loadSelectedCategory();
  }, [value]);

  // Search categories with fuzzy matching
  const searchCategories = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setShowCreateOption(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/categories/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error('Failed to search categories');
      }

      const data = await response.json();
      const categories = data.categories || [];
      
      setSuggestions(categories);
      setShowSuggestions(categories.length > 0 || searchQuery.trim().length > 0);
      
      // Show create option if query doesn't match any existing category
      const exactMatch = categories.some(
        (cat: Category) => cat.name.toLowerCase() === searchQuery.toLowerCase().trim()
      );
      setShowCreateOption(!exactMatch && searchQuery.trim().length > 0);
    } catch (err) {
      console.error('Category search error:', err);
      setSuggestions([]);
      setShowSuggestions(false);
      setShowCreateOption(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Clear selection if query changes
    if (newQuery !== selectedCategory?.name) {
      onChange(null);
      setSelectedCategory(null);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      searchCategories(newQuery);
    }, DEBOUNCE_DELAY);
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setQuery(category.name);
    onChange(category.id);
    setShowSuggestions(false);
    setShowCreateOption(false);
    inputRef.current?.blur();
  };

  // Handle create new category
  const handleCreateCategory = async () => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: query.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      const newCategory = await response.json();
      handleCategorySelect(newCategory);
    } catch (err) {
      console.error('Error creating category:', err);
      alert(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!showSuggestions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const maxIndex = suggestions.length + (showCreateOption ? 1 : 0) - 1;
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        if (selectedIndex < suggestions.length) {
          handleCategorySelect(suggestions[selectedIndex]);
        } else if (showCreateOption) {
          handleCreateCategory();
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedIndex, showCreateOption]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        // Reset query to selected category name if one is selected
        if (selectedCategory) {
          setQuery(selectedCategory.name);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCategory]);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim() || suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || showCreateOption) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.length > 0 && (
            <div className="py-1">
              {suggestions.map((category, index) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                    index === selectedIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateCategory}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-t border-gray-200 flex items-center gap-2 text-gray-700 ${
                selectedIndex === suggestions.length ? 'bg-gray-50' : ''
              }`}
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create "{query.trim()}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

