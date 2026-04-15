import React from 'react';

/**
 * Props for the Section component. This component acts as a collapsible
 * container for organizing content on the main page.
 */
interface SectionProps {
  /** The main title of the section, always visible. */
  title: string;
  /** A short description displayed below the title. */
  description: string;
  /** The content to be displayed when the section is open. */
  children: React.ReactNode;
  /** A boolean indicating whether the section is currently open or collapsed. */
  isOpen: boolean;
  /** A callback function that is executed when the section header is clicked, used to toggle the `isOpen` state. */
  onClick: () => void;
}

/**
 * A simple chevron icon used to indicate the collapsible state.
 */
const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

/**
 * A reusable UI component that creates a collapsible section with a title and description.
 * It manages the open/closed animation and accessibility attributes.
 */
const Section: React.FC<SectionProps> = ({ title, description, children, isOpen, onClick }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg mb-6 overflow-hidden border border-slate-700">
      {/* The clickable header area */}
      <button
        onClick={onClick}
        className="w-full text-left p-6 flex justify-between items-center bg-slate-700/50 hover:bg-slate-700 focus:outline-none"
        aria-expanded={isOpen}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-100">{title}</h2>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </div>
      </button>
      
      {/* The collapsible content area */}
      <div 
        className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!isOpen}
        >
        <div className="p-6 border-t border-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Section;