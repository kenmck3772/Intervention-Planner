
import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot } from 'recharts';
import { WellProgram, JobLogEntry } from '../types';

interface JobLogAnalysisProps {
  program: WellProgram;
}

const JobLogAnalysis: React.FC<JobLogAnalysisProps> = ({ program }) => {
  const data = program.jobLog || [];

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-gray-400 mb-2">No detailed job log data available.</p>
        <p className="text-xs text-gray-500">Upload a CSV log to visualize trip speed and mechanical data.</p>
      </div>
    );
  }

  // Filter interesting events for chart annotations
  const alertEvents = data.filter(d => d.alerts && d.alerts !== 'None' && d.alerts !== 'Resolved' && d.alerts !== 'Complete');

  // Calculate summary stats
  const maxDepth = Math.max(...data.map(d => d.depth));
  const maxHookload = Math.max(...data.map(d => d.hookload));
  const maxTorque = Math.max(...data.map(d => d.torque));
  const startTime = data[0]?.timestamp;
  const endTime = data[data.length - 1]?.timestamp;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
            <div className="text-xs text-gray-400 uppercase">Max Depth</div>
            <div className="text-2xl font-bold text-blue-400">{maxDepth.toLocaleString()} ft</div>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
            <div className="text-xs text-gray-400 uppercase">Max Hookload</div>
            <div className="text-2xl font-bold text-orange-400">{maxHookload} kips</div>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
            <div className="text-xs text-gray-400 uppercase">Max Torque</div>
            <div className="text-2xl font-bold text-purple-400">{maxTorque.toLocaleString()} ft-lbs</div>
        </div>
         <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
            <div className="text-xs text-gray-400 uppercase">Duration</div>
            <div className="text-2xl font-bold text-green-400">{data.length > 0 ? Math.round((data[data.length-1].timeMinutes)/60 * 10)/10 : 0} hrs</div>
        </div>
      </div>

      {/* Chart 1: Trip Profile & Hookload */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
        <h4 className="text-md font-semibold text-gray-200 mb-4 border-b border-slate-600 pb-2">Trip Profile & Hookload Analysis</h4>
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }} syncId="jobLogId">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                        dataKey="timeMinutes" 
                        label={{ value: 'Time (min)', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }} 
                        stroke="#94a3b8"
                    />
                    <YAxis 
                        yAxisId="left" 
                        reversed={true} 
                        label={{ value: 'Depth (ft)', angle: -90, position: 'insideLeft', fill: '#60a5fa' }} 
                        stroke="#60a5fa"
                    />
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        label={{ value: 'Hookload (kips)', angle: 90, position: 'insideRight', fill: '#fb923c' }} 
                        stroke="#fb923c"
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                        itemStyle={{ color: '#cbd5e1' }}
                        labelFormatter={(label) => `Time: ${label} min`}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    
                    {/* Depth Area */}
                    <Area yAxisId="left" type="monotone" dataKey="depth" name="Bit Depth" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={2} />
                    
                    {/* Hookload Line */}
                    <Line yAxisId="right" type="monotone" dataKey="hookload" name="Hookload" stroke="#fb923c" strokeWidth={2} dot={false} />

                    {/* Alert Annotations */}
                    {alertEvents.map((entry, index) => (
                         <ReferenceDot 
                            key={index} 
                            yAxisId="left" 
                            x={entry.timeMinutes} 
                            y={entry.depth} 
                            r={6} 
                            fill="#ef4444" 
                            stroke="white"
                            ifOverflow="extendDomain"
                        />
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Torque & Pressure */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
        <h4 className="text-md font-semibold text-gray-200 mb-4 border-b border-slate-600 pb-2">Drilling Mechanics & Hydraulics</h4>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }} syncId="jobLogId">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="timeMinutes" hide />
                    <YAxis 
                        yAxisId="left" 
                        label={{ value: 'Torque (ft-lbs)', angle: -90, position: 'insideLeft', fill: '#c084fc' }} 
                        stroke="#c084fc"
                    />
                     <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        label={{ value: 'WHP (psi)', angle: 90, position: 'insideRight', fill: '#2dd4bf' }} 
                        stroke="#2dd4bf"
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                        itemStyle={{ color: '#cbd5e1' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    
                    <Line yAxisId="left" type="monotone" dataKey="torque" name="Torque" stroke="#c084fc" dot={false} strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="whp" name="Wellhead Pressure" stroke="#2dd4bf" dot={false} strokeWidth={2} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Alert Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <h4 className="text-md font-semibold text-gray-200 p-4 bg-slate-700/50 border-b border-slate-600">Detailed Alert Log</h4>
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-400">
                <thead className="bg-slate-900 text-gray-200 uppercase font-medium">
                    <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Depth</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Alert Message</th>
                        <th className="px-4 py-3">Metric Check</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {alertEvents.length > 0 ? (
                        alertEvents.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-300">{row.timestamp.split(' ')[1]}</td>
                                <td className="px-4 py-3 text-blue-400 font-medium">{row.depth} ft</td>
                                <td className="px-4 py-3">{row.status}</td>
                                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-red-900/50 text-red-200 border border-red-800 text-xs font-bold">{row.alerts}</span></td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    HKLD: {row.hookload}k | WHP: {row.whp}psi
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No alerts detected in the log.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default JobLogAnalysis;
