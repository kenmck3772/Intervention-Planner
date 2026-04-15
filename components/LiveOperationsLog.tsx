
import React from 'react';
import { DailyReport } from '../types';

interface LiveOperationsLogProps {
  dailyReports: DailyReport[];
}

// Icon components for different event categories
const MilestoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const NPTIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd" /></svg>;
const SafetyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5.023L2 5.033v4.223c0 3.822 3.584 7.23 7.834 8.728a1 1 0 00.332 0c4.25-1.498 7.834-4.906 7.834-8.728V5.032l-.165-.009A11.954 11.954 0 0110 1.944zM9 13a1 1 0 112 0v2a1 1 0 11-2 0v-2zm0-7a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const ObservationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.064 7-9.542 7S3.268 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const EquipmentFailureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;


const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Milestone': return <MilestoneIcon />;
        case 'NPT': return <NPTIcon />;
        case 'Safety': return <SafetyIcon />;
        case 'Observation': return <ObservationIcon />;
        case 'Equipment Failure': return <EquipmentFailureIcon />;
        default: return <ObservationIcon />;
    }
};

const LiveOperationsLog: React.FC<LiveOperationsLogProps> = ({ dailyReports }) => {
  const sortedReports = [...dailyReports].sort((a, b) => a.day - b.day);

  return (
    <div className="bg-gray-800 text-gray-200 rounded-lg shadow-inner h-[400px] flex flex-col">
        <h3 className="text-lg font-semibold text-white p-4 border-b border-gray-700">Live Operations Log</h3>
        <div className="overflow-y-auto p-4 flex-grow">
            {sortedReports.length === 0 ? (
                <p className="text-gray-400">No operational reports available.</p>
            ) : (
                <div className="space-y-4">
                {sortedReports.map(report => (
                    <div key={report.id}>
                        <h4 className="font-bold text-cyan-400">Day {report.day} Summary</h4>
                        <p className="text-sm text-gray-400 italic mb-2">{report.summary}</p>
                        <ul className="space-y-1 pl-4 border-l border-gray-600">
                            {report.events.map(event => (
                                <li key={event.id} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 pt-1">{getCategoryIcon(event.category)}</div>
                                    <div>
                                        <p className="text-sm font-mono"><span className="text-yellow-400">{event.timestamp}</span> - <span className="font-semibold text-gray-100">{event.category}:</span> {event.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default LiveOperationsLog;
