import React, { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Props for the InputField component. This is a versatile component that can render
 * as a standard input, a textarea, or a select dropdown, and includes built-in
 * styling for validation errors and units.
 */
type InputFieldProps = {
  /** Optional label displayed above the input field. */
  label?: string;
  /** Unique identifier for the input, used for the `id` attribute and to link the label. */
  id: string;
  /** The name attribute for the input, crucial for form submissions and state management. */
  name: string;
  /** The current value of the input field. */
  value: string | number;
  /** Callback function that is executed when the input's value changes. */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Callback function that is executed when the input loses focus. */
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** The type of the input element, e.g., 'text', 'number', 'date'. Ignored if `as` is 'textarea' or 'select'. */
  type?: 'text' | 'number' | 'date';
  /** Determines which HTML element to render. */
  as?: 'input' | 'textarea' | 'select';
  /** Placeholder text for the input field. */
  placeholder?: string;
  /** Additional CSS classes to apply to the input element. */
  className?: string;
  /** Used for `<option>` elements when `as` is 'select'. */
  children?: React.ReactNode;
  /** If provided, displays an error message below the input and applies error styling. */
  error?: string;
  /** An optional unit string (e.g., 'ft', 'psi') to display inside the input field. */
  unit?: string;
  /** If true, the input field will be disabled and visually styled as such. */
  disabled?: boolean;
  /** Minimum value for numeric inputs. */
  min?: number;
  /** Maximum value for numeric inputs. */
  max?: number;
  /** Step value for numeric inputs. */
  step?: number;
  /** If true, the field is marked as required. */
  required?: boolean;
  /** Optional helper text displayed below the input. */
  helperText?: string;
};

/**
 * A flexible and reusable input component for the application.
 * It handles different input types, validation states, and optional units.
 */
const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  type = 'text',
  as = 'input',
  placeholder = '',
  className = '',
  children,
  error,
  unit,
  disabled,
  min,
  max,
  step,
  required,
  helperText,
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);

  /**
   * Internal validation logic based on props.
   */
  const validate = useCallback((val: string | number) => {
    if (required && (val === undefined || val === null || val === '')) {
      return 'This field is required';
    }
    
    if (type === 'number' && val !== '') {
      const num = Number(val);
      if (isNaN(num)) return 'Please enter a valid number';
      if (min !== undefined && num < min) return `Value must be at least ${min}`;
      if (max !== undefined && num > max) return `Value must be at most ${max}`;
    }
    
    return null;
  }, [required, type, min, max]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const errorMsg = validate(e.target.value);
    setInternalError(errorMsg);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Clear internal error while typing if the new value is valid
    if (internalError) {
      const errorMsg = validate(e.target.value);
      if (!errorMsg) setInternalError(null);
    }
    onChange(e);
  };

  const displayError = error || internalError;

  // Base styling for all input types
  const baseClasses = "mt-1 block w-full px-3 py-2 bg-slate-700 border rounded-md shadow-sm focus:outline-none sm:text-sm text-gray-200 disabled:bg-slate-800 disabled:text-gray-500 disabled:border-slate-600 transition-colors duration-200";
  // Styling for when there is a validation error
  const errorClasses = "border-red-500 text-red-400 placeholder-red-400 focus:ring-red-500 focus:border-red-500";
  // Default styling
  const normalClasses = "border-slate-600 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500";
  
  // Dynamically adjust padding to make room for the unit and/or error icon
  let paddingClasses = '';
  if (unit && displayError) {
      paddingClasses = 'pr-16'; // Padding for both unit and icon
  } else if (unit) {
      paddingClasses = 'pr-12'; // Padding for unit only
  } else if (displayError) {
      paddingClasses = 'pr-10'; // Padding for icon only
  }

  const finalClasses = `${baseClasses} ${className} ${displayError ? errorClasses : normalClasses} ${paddingClasses}`;

  /**
   * Renders the correct input element based on the `as` prop.
   */
  const renderInput = () => {
    switch (as) {
      case 'textarea':
        return (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={4}
            className={finalClasses}
            aria-invalid={!!displayError}
            disabled={disabled}
            required={required}
          />
        );
      case 'select':
        return (
          <select
            id={id}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={finalClasses}
            aria-invalid={!!displayError}
            disabled={disabled}
            required={required}
          >
            {children}
          </select>
        );
      default: // 'input'
        return (
          <div className="relative">
            <input
              type={type}
              id={id}
              name={name}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={finalClasses}
              aria-invalid={!!displayError}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              required={required}
            />
             {/* Container for the inline icon and unit */}
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </motion.div>
                )}
                {unit && <span className={`text-gray-400 sm:text-sm ${displayError ? 'ml-2' : ''}`}>{unit}</span>}
             </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-400">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      <AnimatePresence mode="wait">
        {displayError ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-1 text-sm text-red-500 flex items-center gap-1"
            id={`${id}-error`}
          >
            {displayError}
          </motion.p>
        ) : helperText ? (
          <motion.p
            key="helper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default InputField;