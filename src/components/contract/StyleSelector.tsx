'use client';

import { useState, useEffect, useRef } from 'react';
import { type Style, type StyleSuggestion } from '@/types/contract';
import FormField from '@/components/forms/FormField';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

interface StyleSelectorProps {
  value: string;
  onChange: (styleNumber: string) => void;
  error?: string;
}

export default function StyleSelector({ value, onChange, error }: StyleSelectorProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StyleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  
  // Sync with external value changes
  const currentStyleNumber = value;

  // Search for styles when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchStyles(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  // Load style details if style number is set from external source
  useEffect(() => {
    if (currentStyleNumber && currentStyleNumber !== selectedStyle?.style_number) {
      loadStyleDetails(currentStyleNumber);
    }
  }, [currentStyleNumber, selectedStyle]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStyles = async (query: string) => {
    if (!query || query.length < 2) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/styles/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.styles);
        setShowSuggestions(true);
      } else {
        console.error('Style search failed:', data.message);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Style search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStyleDetails = async (styleNumber: string) => {
    try {
      const response = await fetch(`/api/styles/search?q=${encodeURIComponent(styleNumber)}&exact=true`);
      const data = await response.json();
      
      if (data.success && data.styles.length > 0) {
        const style = data.styles[0].style;
        setSelectedStyle(style);
        setSearchQuery(style.style_number);
      }
    } catch (error) {
      console.error('Failed to load style details:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // Update parent component
    onChange(newValue);
    
    // Clear selected style if input doesn't match
    if (selectedStyle && newValue !== selectedStyle.style_number) {
      setSelectedStyle(null);
    }
  };

  const handleStyleSelect = (styleSuggestion: StyleSuggestion) => {
    const style = styleSuggestion.style;
    setSelectedStyle(style);
    setSearchQuery(style.style_number);
    onChange(style.style_number);
    setShowSuggestions(false);
    
    // Focus back to input for better UX
    inputRef.current?.focus();
  };

  const clearSelection = () => {
    setSelectedStyle(null);
    setSearchQuery('');
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <FormField
        label="Style Number"
        required
        error={error}
        helpText="Start typing to search for styles by number, description, or item number"
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={(e) => e.key === 'Escape' && setShowSuggestions(false)}
            placeholder="Enter or search style number..."
            className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
          )}
          
          {/* Clear button */}
          {searchQuery && !isLoading && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </FormField>

      {/* Style suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
        >
          {suggestions.map((suggestion, index) => {
            const style = suggestion.style;
            const isSelected = selectedStyle?.style_number === style.style_number;
            
            return (
              <div
                key={`${style.style_number}-${index}`}
                onClick={() => handleStyleSelect(suggestion)}
                className={`cursor-pointer select-none relative py-3 px-4 hover:bg-blue-50 ${
                  isSelected ? 'bg-blue-100' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{style.style_number}</span>
                      <span className="text-sm text-gray-500">({style.item_number})</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mt-1">{style.item_desc}</p>
                    
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>Season: {style.season}</span>
                      <span>Line: {style.business_line}</span>
                    </div>
                  </div>
                  
                  {suggestion.confidence && (
                    <div className="ml-2 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {Math.round(suggestion.confidence * 100)}% match
                      </span>
                    </div>
                  )}
                </div>
                
                {isSelected && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && suggestions.length === 0 && debouncedQuery.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-3 px-4 text-base ring-1 ring-black ring-opacity-5">
          <div className="text-gray-500 text-center">
            <div className="text-sm">No styles found matching "{debouncedQuery}"</div>
            <div className="text-xs mt-1">Try searching by style number, item number, or description</div>
          </div>
        </div>
      )}

      {/* Selected style preview */}
      {selectedStyle && (
        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">Style Selected</span>
              </div>
              
              <div className="mt-2 text-sm text-green-700">
                <div><strong>{selectedStyle.style_number}</strong> - {selectedStyle.item_desc}</div>
                <div className="text-xs mt-1">
                  Item: {selectedStyle.item_number} | Season: {selectedStyle.season} | Line: {selectedStyle.business_line}
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={clearSelection}
              className="ml-4 text-green-600 hover:text-green-800"
              title="Clear selection"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}