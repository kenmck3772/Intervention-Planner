
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { WellProgram } from '../types';

interface AIAnomalyDetectorProps {
    program: WellProgram;
}

const AiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h.5a1.5 1.5 0 010 3H14a1 1 0 00-1 1v1.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H9a1 1 0 001-1v-.5z" /><path d="M9 11.5a1.5 1.5 0 013 0V12a1 1 0 001 1h.5a1.5 1.5 0 010 3H13a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0V17a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H8a1 1 0 001-1v-.5z" /><path d="M6.5 6.5A1.5 1.5 0 018 5h.5a1 1 0 001-1V3.5a1.5 1.5 0 01-3 0V4a1 1 0 00-1 1h-.5a1.5 1.5 0 010 3H5a1 1 0 001 1v.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1H1.5a1.5 1.5 0 010-3H2a1 1 0 001-1v-.5z" /></svg>;
const Spinner = () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const AIAnomalyDetector: React.FC<AIAnomalyDetectorProps> = ({ program }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [error, setError] = useState('');

    const handleAnalyzeData = async () => {
        setIsLoading(true);
        setAnalysisResult('');
        setError('');

        const liveDataSummary = program.liveOperationsData.map(d => 
            `Time: ${d.timestamp}, Planned Annulus Pressure: ${d.plannedAnnulusPressure} psi, Actual Annulus Pressure: ${d.actualAnnulusPressure} psi`
        ).join('\n');

        const eventsSummary = program.dailyReports.map(r => 
            `Day ${r.day}: ${r.summary}\n` + r.events.map(e => `- ${e.timestamp} [${e.category}] ${e.description}`).join('\n')
        ).join('\n\n');

        const prompt = `
            You are an expert well intervention supervisor with 30 years of experience in deepwater operations.
            Your task is to analyze the following real-time operational data for the well "${program.wellHeader.wellName}" and identify any potential anomalies, deviations from the plan, or emerging risks.

            Current Well Status: ${program.wellStatus.suspensionDetails}
            Primary Objective: ${program.objectives.core}

            --- Live Annulus Pressure Trend Data ---
            ${liveDataSummary}

            --- Operational Event Log ---
            ${eventsSummary}

            --- Analysis Request ---
            Based on all the provided data, please provide a concise, bullet-pointed analysis.
            Focus on:
            1.  Any significant deviations between planned and actual pressures.
            2.  Correlations between events in the log and changes in pressure data.
            3.  Potential root causes for any anomalies observed.
            4.  Recommended immediate actions or observations to watch for.
            
            Format your response in simple Markdown.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setAnalysisResult(response.text);
        } catch (err) {
            console.error("Error analyzing data:", err);
            setError("Failed to get analysis from AI. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border shadow-sm h-[400px] flex flex-col">
            <div className="flex items-center space-x-3 p-4 border-b">
                <AiIcon />
                <h3 className="text-lg font-semibold text-gray-800">AI Anomaly Detection</h3>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
                {analysisResult ? (
                     <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                        {analysisResult}
                    </pre>
                ) : (
                    <p className="text-sm text-gray-500">
                        Click the "Analyze" button to have the AI assistant review the latest live data for potential issues, trends, and deviations from the plan.
                    </p>
                )}
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
            <div className="p-4 border-t bg-gray-50">
                <button 
                    onClick={handleAnalyzeData}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? <><Spinner /> Thinking...</> : 'Analyze Live Data'}
                </button>
            </div>
        </div>
    );
};

export default AIAnomalyDetector;
