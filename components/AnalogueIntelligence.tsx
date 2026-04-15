
import React from 'react';
import { WellProgram } from '../types';

interface AnalogueIntelligenceProps {
    analogues: WellProgram[];
    onCopyLesson: (lesson: string, wellName: string) => void;
}

const ShieldIcon = ({ risk }: { risk: string }) => {
    const color = risk === 'Low' ? 'text-green-400' : risk === 'Medium' ? 'text-yellow-400' : 'text-red-500';
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${color}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
};

const AnalogueIntelligence: React.FC<AnalogueIntelligenceProps> = ({ analogues, onCopyLesson }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {analogues.map(well => {
                    // Determine Risk Level artificially if not explicitly in object, or parse from well data if we had it
                    // For this demo, we infer from the well name/ID logic or just display generic
                    const lesson = well.closeout.lessonsLearned || "No specific lessons recorded.";
                    const isCritical = well.wellStatus.suspensionDetails.includes('Critical');
                    
                    return (
                        <div key={well.id} className="bg-slate-800 rounded-lg border border-slate-700 shadow-lg flex flex-col">
                            <div className="p-4 border-b border-slate-700 flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-100 text-lg">{well.wellHeader.wellName}</h4>
                                    <p className="text-xs text-gray-400">{well.wellHeader.fieldBlock} | {well.wellHeader.wellType}</p>
                                </div>
                                <ShieldIcon risk={isCritical ? 'High' : 'Medium'} />
                            </div>
                            
                            <div className="p-4 flex-grow space-y-3">
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Last Intervention</span>
                                    <p className="text-sm text-gray-300">{well.wellHeader.programTitle}</p>
                                </div>
                                <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
                                    <span className="text-xs font-semibold text-blue-400 uppercase flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                        Lesson Learned
                                    </span>
                                    <p className="text-sm text-gray-200 mt-1 italic">"{lesson}"</p>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                                <button 
                                    onClick={() => onCopyLesson(lesson, well.wellHeader.wellName)}
                                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                                    Copy to W666 Risks
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnalogueIntelligence;
