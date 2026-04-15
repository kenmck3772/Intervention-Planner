import React from 'react';

/**
 * Props for the ReadOnlyField component.
 * This component is used to display data that is not meant to be edited by the user,
 * such as calculated results or static information.
 */
type ReadOnlyFieldProps = {
  /** The label displayed above the field. */
  label: string;
  /** The value to be displayed. Can be a string, number, or null/undefined. */
  value: string | number | undefined | null;
  /** Optional additional CSS classes. */
  className?: string;
  /** An optional unit string (e.g., 'ft', 'psi') to display next to the value. */
  unit?: string;
};

/**
 * A simple, styled component for displaying read-only data fields.
 */
const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value, className = '', unit }) => {
  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md shadow-sm sm:text-sm text-gray-800 min-h-[38px] flex items-center justify-between">
        {/* Display the value, or a dash if it's null/undefined */}
        <span>{value || '-'}</span>
        {unit && <span className="text-gray-500 ml-2">{unit}</span>}
      </div>
    </div>
  );
};

export default ReadOnlyField;
