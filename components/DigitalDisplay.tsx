import React from 'react';

/**
 * Props for the DigitalDisplay component.
 * This component is designed to look like a digital readout for a single, important value.
 */
interface DigitalDisplayProps {
  /** The title or label for the value being displayed (e.g., 'SIWHP'). */
  label: string;
  /** The numerical value to display. */
  value: string | number;
  /** The unit for the value (e.g., 'psi', 'ft'). */
  unit: string;
}

/**
 * A component that renders a value and its unit in a style reminiscent of a
 * digital LCD screen, often used for dashboards and key metrics.
 */
const DigitalDisplay: React.FC<DigitalDisplayProps> = ({ label, value, unit }) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg text-center border-b-4 border-cyan-500">
      <div className="text-sm font-medium text-cyan-400 uppercase tracking-wider">{label}</div>
      <div className="flex items-baseline justify-center my-2">
        <div className="text-4xl lg:text-5xl font-bold text-white truncate" title={String(value)}>
          {/* Display the value, or '--' if it's not available */}
          {value || '--'}
        </div>
        <div className="text-lg text-gray-400 ml-2">{unit}</div>
      </div>
    </div>
  );
};

export default DigitalDisplay;
