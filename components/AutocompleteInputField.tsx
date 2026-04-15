import React, { useState, useEffect, useRef } from 'react';

/**
 * Props for the AutocompleteInputField component.
 * This component provides a text input with a dropdown list of suggestions
 * that filters as the user types.
 */
type AutocompleteInputFieldProps = {
  /** Optional label displayed above the input field. */
  label?: string;
  /** Unique identifier for the input. */
  id: string;
  /** The name attribute for the input. */
  name: string;
  /** The current value of the input. */
  value: string;
  /** Callback function that fires when the input value changes. */
  onChange: (value: string) => void;
  /** A list of all possible suggestion strings. */
  suggestions: string[];
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Additional CSS classes for the input element. */
  className?: string;
  /** An error message to display if validation fails. */
  error?: string;
};

/**
 * An input field component with autocomplete functionality.
 * It manages its own internal state for filtering and displaying suggestions.
 */
const AutocompleteInputField: React.FC<AutocompleteInputFieldProps> = ({
  label,
  id,
  name,
  value,
  onChange,
  suggestions,
  placeholder = '',
  className = '',
  error,
}) => {
  // --- STATE ---
  const [inputValue, setInputValue] = useState(value);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // Index of the currently highlighted suggestion
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state if the parent's value prop changes.
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Effect to handle clicks outside the component to close the dropdown.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value;
    setInputValue(userInput);
    onChange(userInput); // Notify parent of the change

    // Filter suggestions based on user input
    const filtered = suggestions.filter(
      suggestion => suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1
    );
    setFilteredSuggestions(filtered);
    setIsDropdownVisible(true);
    setActiveIndex(-1); // Reset highlight
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion); // Notify parent of the change
    setFilteredSuggestions([]);
    setIsDropdownVisible(false);
  };
  
  // Handle keyboard navigation (Arrow Up/Down, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSuggestionClick(filteredSuggestions[activeIndex]);
      }
    } else if (e.key === 'ArrowUp') {
       e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowDown') {
       e.preventDefault();
      setActiveIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'Escape') {
      setIsDropdownVisible(false);
    }
  };

  // --- STYLING ---
  const baseClasses = "mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none sm:text-sm";
  const errorClasses = "border-red-500 text-red-900 placeholder-red-400 focus:ring-red-500 focus:border-red-500";
  const normalClasses = "border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500";
  const finalClasses = `${baseClasses} ${className} ${error ? errorClasses : normalClasses}`;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type="text"
        id={id}
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputChange} // Show suggestions on focus
        placeholder={placeholder}
        className={finalClasses}
        autoComplete="off"
        aria-invalid={!!error}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      {/* Suggestions Dropdown */}
      {isDropdownVisible && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-500 hover:text-white ${
                index === activeIndex ? 'bg-blue-500 text-white' : ''
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInputField;
