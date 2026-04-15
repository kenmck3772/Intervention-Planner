import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WellProgram } from '../types';
import DigitalDisplay from './DigitalDisplay';

/**
 * Props for the OperationalCharts component.
 */
interface OperationalChartsProps {
  /** The well program data, which contains live operational data points. */
  program: WellProgram;
}

/**
 * A component that displays operational data, including digital readouts for current
 * pressures and a time-series chart for pressure trends.
 */
const OperationalCharts: React.FC<OperationalChartsProps> = ({ program }) => {
  const data = program.liveOperationsData;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No live operational data available to display.</p>
      </div>
    );
  }

  // Get the latest annulus pressure reading for the digital display.
  const latestAnnulusPressure = data.length > 0 ? data[data.length - 1].actualAnnulusPressure : '--';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-4 text-center">Live Well Pressures</h4>
        <div className="grid grid-cols-2 gap-4">
          <DigitalDisplay label="SIWHP" value={program.wellStatus.sihwp || 'N/A'} unit="psi" />
          <DigitalDisplay label="A-Annulus" value={latestAnnulusPressure} unit="psi" />
          <DigitalDisplay label="B-Annulus" value="--" unit="psi" />
          <DigitalDisplay label="C-Annulus" value="--" unit="psi" />
        </div>
      </div>
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-4 text-center">Annulus Pressure Trend (psi)</h4>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis label={{ value: 'psi', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => `${value} psi`} />
              <Legend />
              <Line type="monotone" dataKey="plannedAnnulusPressure" name="Planned Annulus Pressure" stroke="#ff7300" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="actualAnnulusPressure" name="Actual Annulus Pressure" stroke="#f54242" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
           <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">No trend data available.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default OperationalCharts;
