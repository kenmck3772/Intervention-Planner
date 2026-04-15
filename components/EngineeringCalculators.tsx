import React, { useState, useEffect, useCallback } from 'react';
import { WellProgram, FluidColumn } from '../types';
import InputField from './InputField';
import ReadOnlyField from './ReadOnlyField';

/**
 * Props for the EngineeringCalculators component.
 */
interface EngineeringCalculatorsProps {
  /** The current well program data, needed for fluid levels and other inputs. */
  program: WellProgram;
  /** 
   * A callback function that notifies the parent component of the latest calculated
   * depth and pressure, allowing other components (like the schematic) to use this data.
   */
  onCalculationChange: (depth: string, pressure: string) => void;
}

/**
 * A simple card component for visually separating different calculators.
 */
const CalculatorCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 shadow-sm">
        <h4 className="text-md font-semibold text-gray-200">{title}</h4>
        <p className="text-xs text-gray-400 mb-4">{description}</p>
        {children}
    </div>
);

/**
 * A component that houses various engineering calculators relevant to well interventions.
 * Currently includes a hydrostatic pressure calculator. Other calculators are stubbed for future implementation.
 */
const EngineeringCalculators: React.FC<EngineeringCalculatorsProps> = ({ program, onCalculationChange }) => {
  const [calculationDepth, setCalculationDepth] = useState<string>('0');
  const [hydrostaticPressure, setHydrostaticPressure] = useState<string>('0.00');

  /**
   * Calculates the hydrostatic pressure at a given depth based on the fluid columns in the well.
   * This function is wrapped in `useCallback` to prevent it from being recreated on every render,
   * which is a performance optimization.
   * @param depthStr The target depth (MD) as a string.
   * @param fluidLevels An array of fluid columns defined in the well program.
   * @returns The calculated hydrostatic pressure in psi, formatted to two decimal places.
   */
  const calculateHydrostaticPressure = useCallback((depthStr: string, fluidLevels: FluidColumn[]): string => {
    const targetDepth = parseFloat(depthStr);
    if (isNaN(targetDepth) || targetDepth <= 0 || !fluidLevels || fluidLevels.length === 0) {
      return '0.00';
    }

    let cumulativePressure = 0;
    
    // Process fluids to ensure they are sorted and contain valid numbers.
    const processedFluids = fluidLevels
      .map(f => ({
          top: parseFloat(f.topDepth as string),
          bottom: parseFloat(f.bottomDepth as string),
          density: parseFloat(f.density as string),
      }))
      .filter(f => !isNaN(f.top) && !isNaN(f.bottom) && !isNaN(f.density))
      .sort((a, b) => a.top - b.top); // Sort from shallowest to deepest.

    // Iterate through each fluid column and add its pressure contribution.
    for (const fluid of processedFluids) {
      if (targetDepth <= fluid.top) break; // We haven't reached this fluid column yet.
      
      // The height of this specific fluid column that is above our target depth.
      const intervalBottom = Math.min(targetDepth, fluid.bottom);
      const height = intervalBottom - fluid.top;

      // The standard industry formula for hydrostatic pressure:
      // Pressure (psi) = 0.052 * Density (ppg) * True Vertical Height (ft)
      // Note: This calculation assumes MD is close to TVD for simplicity. A more complex
      // implementation would integrate the deviation survey.
      if (height > 0) {
        cumulativePressure += 0.052 * fluid.density * height;
      }

      if (targetDepth <= fluid.bottom) break; // We've found our depth, no need to go further.
    }

    return cumulativePressure.toFixed(2);
  }, []);

  // This effect re-runs the calculation whenever the input depth or the well's fluid levels change.
  useEffect(() => {
    if (program?.wellStatus?.fluidLevels) {
        const pressure = calculateHydrostaticPressure(calculationDepth, program.wellStatus.fluidLevels);
        setHydrostaticPressure(pressure);
        // Notify the parent component of the new calculation result.
        onCalculationChange(calculationDepth, pressure);
    }
  }, [calculationDepth, program?.wellStatus?.fluidLevels, calculateHydrostaticPressure, onCalculationChange]);
  
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Engineering Calculators</h3>
        <div className="space-y-4">
            
            <CalculatorCard title="Hydrostatic Pressure" description="Calculate pressure exerted by a column of fluid.">
                <div className="space-y-4">
                    <InputField
                        label="Calculation Depth"
                        id="calc-depth"
                        name="calc-depth"
                        type="number"
                        value={calculationDepth}
                        onChange={(e) => setCalculationDepth(e.target.value)}
                        placeholder="Enter depth"
                        unit="ft MD"
                        min={0}
                        required
                        helperText="Enter the depth at which to calculate hydrostatic pressure."
                    />
                    <ReadOnlyField
                        label="Calculated Pressure"
                        value={hydrostaticPressure}
                        unit="psi"
                    />
                </div>
            </CalculatorCard>

        </div>
    </div>
  );
};

export default EngineeringCalculators;