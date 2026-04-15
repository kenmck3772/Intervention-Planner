
// App.tsx
// This is the main component of the WellTegra application. It serves as the root container
// for all other components and manages the overall application state.

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

import {
  WellProgram,
  KeyObservation,
  UploadedFile,
  MOCRecord,
  DeviationSurveyStation,
  JobLogEntry,
  FluidMaterial,
  CasingSchema,
  TreeValve,
  FluidColumn,
} from './types';
import { INITIAL_WELL_PROGRAMS } from './constants';
import Section from './components/Section';
import InputField from './components/InputField';
import WellboreSchematicViewer from './components/WellboreSchematicViewer';
import Wellbore3DViewer from './components/Wellbore3DViewer';
import EngineeringCalculators from './components/EngineeringCalculators';
import LiveOperationsLog from './components/LiveOperationsLog';
import AIAnomalyDetector from './components/AIAnomalyDetector';
import JobLogAnalysis from './components/JobLogAnalysis';
import AnalogueIntelligence from './components/AnalogueIntelligence';

// --- IMMUTABLE STATE HELPER ---
const set = (obj: any, path: string, value: any): any => {
    const newObj = JSON.parse(JSON.stringify(obj));
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = newObj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined) {
             current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    return newObj;
};

// --- UI HELPER COMPONENTS & ICONS ---
const FileTextIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const TableIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);
const DocumentIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>);
const UploadIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>);
const TrashIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const PlusCircleIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>);
const Spinner: React.FC = () => (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

const MocStatusBadge: React.FC<{ status: MOCRecord['status'] }> = ({ status }) => {
    const statusClasses: Record<MOCRecord['status'], string> = {
        'Draft': 'bg-gray-600 text-gray-100',
        'Pending Approval': 'bg-yellow-600 text-yellow-100',
        'Approved': 'bg-green-600 text-green-100',
        'Rejected': 'bg-red-600 text-red-100',
        'Closed': 'bg-blue-600 text-blue-100',
    };
    return (<span className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${statusClasses[status]}`}>{status}</span>);
};

const PermitStatusBadge: React.FC<{ status: FluidMaterial['permitStatus'] }> = ({ status }) => {
    const statusClasses: Record<FluidMaterial['permitStatus'], string> = {
        'Approved': 'bg-green-600 text-green-100',
        'Pending': 'bg-yellow-600 text-yellow-100',
        'Not Required': 'bg-gray-600 text-gray-100',
    };
    return (<span className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${statusClasses[status]}`}>{status}</span>);
};

const getFileIcon = (fileType: string) => {
    if (fileType.includes('csv')) return <TableIcon />;
    if (fileType.startsWith('text/')) return <FileTextIcon />;
    return <DocumentIcon />;
};
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const formatSurveyDataToString = (surveyData: DeviationSurveyStation[]): string => {
    return surveyData.map(s => `${s.md},${s.incl},${s.azim}`).join('\n');
};

const StatusTag: React.FC<{ label: string; value: React.ReactNode; color?: 'green' | 'red' | 'yellow' | 'blue' }> = ({ label, value, color = 'blue' }) => {
    const colors = {
        green: 'bg-green-900/50 text-green-300 border-green-500/50',
        red: 'bg-red-900/50 text-red-300 border-red-500/50',
        yellow: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/50',
        blue: 'bg-blue-900/50 text-blue-300 border-blue-500/50'
    };
    return (
        <div className={`p-3 rounded-lg border ${colors[color]}`}>
            <div className="text-xs uppercase font-semibold text-gray-400">{label}</div>
            <div className="text-lg font-bold truncate" title={String(value)}>{value}</div>
        </div>
    );
};

const ProgramDashboard: React.FC<{ program: WellProgram }> = ({ program }) => {
    const activePhase = program.phases.find(p => p.status === 'Active')?.name || 'N/A';
    const totalAFE = program.afe.find(a => a.lineItemCode === 'TOTAL')?.estimatedCost || 0;
    const actualCost = program.afe.find(a => a.lineItemCode === 'TOTAL')?.accruedCost || 0;

    const integrityStatus = () => {
        const details = program.wellStatus.suspensionDetails.toLowerCase();
        if (details.includes('critical') || details.includes('total loss') || details.includes('failed')) return { text: 'CRITICAL', color: 'red' as const };
        if (details.includes('degraded') || details.includes('integrity')) return { text: 'DEGRADED', color: 'yellow' as const };
        return { text: 'STABLE', color: 'green' as const };
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusTag label="Well Status" value={program.wellStatus.suspensionDetails.split('.')[0] || 'Planning'} color={integrityStatus().color} />
                <StatusTag label="Program Status" value={`[ACTIVE] ${activePhase}`} color="green" />
                <StatusTag label="AFE" value={program.wellHeader.programTitle.split(':')[0]} color="blue" />
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Operational Flow</h3>
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {program.phases.map((phase, index) => {
                        const statusClasses: Record<NonNullable<typeof phase.status>, string> = {
                            'Complete': 'bg-green-800 border-green-600',
                            'Active': 'bg-blue-600 border-blue-400 ring-2 ring-offset-2 ring-offset-slate-800 ring-blue-400 shadow-lg',
                            'Next': 'bg-slate-600 border-slate-500',
                            'Locked': 'bg-slate-700/50 border-slate-700 text-gray-500',
                        };
                        const phaseStatus = phase.status || 'Locked';
                        return (
                            <React.Fragment key={phase.id}>
                                <div className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-semibold border-b-2 transition-all ${statusClasses[phaseStatus]}`}>
                                    {phase.name}
                                </div>
                                {index < program.phases.length - 1 && <div className="text-gray-500 font-bold">&gt;</div>}
                            </React.Fragment>
                        );
                    })}
                    {program.phases.length === 0 && <span className="text-gray-500 text-sm">No operational phases defined.</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <h3 className="text-sm font-semibold text-red-400 uppercase mb-2">( ! ) KEY HAZARDS</h3>
                    <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
                        {program.risk.hazards ? program.risk.hazards.split('\n').map((h, i) => h && <li key={i}>{h}</li>) : <li className="text-gray-500">No hazards identified.</li>}
                        {program.keyObservations.filter(o => o.type === 'Hazard').map(o => <li key={o.id}>{o.description}</li>)}
                    </ul>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <h3 className="text-sm font-semibold text-green-400 uppercase mb-2">( $ ) FINANCIALS</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>AFE Budget:</span> <span className="font-mono">${totalAFE.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Accrued Cost:</span> <span className="font-mono">${actualCost.toLocaleString()}</span></div>
                        <div className="w-full bg-slate-600 rounded-full h-2.5 mt-1">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${totalAFE > 0 ? (actualCost / totalAFE) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>
                 <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <h3 className="text-sm font-semibold text-blue-400 uppercase mb-2">( i ) PERSONNEL</h3>
                     <ul className="space-y-1 text-sm text-gray-300 list-disc list-inside">
                        {program.personnel.map(p => <li key={p.id}><strong>{p.name}</strong> ({p.role})</li>)}
                        {program.personnel.length === 0 && <li className="text-gray-500">No personnel assigned.</li>}
                     </ul>
                </div>
            </div>
        </div>
    );
};


const wellDataTabs = [
    { id: 'header', label: 'Well Header' },
    { id: 'trajectory', label: 'Well Trajectory' },
    { id: 'casing', label: 'Casing Schematics' },
    { id: 'tubing', label: 'Tubing Schematics' },
    { id: 'reservoir', label: 'Reservoir Data' },
    { id: 'status', label: 'Well Status' },
];

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [wellPrograms, setWellPrograms] = useState<WellProgram[]>(INITIAL_WELL_PROGRAMS);
    const [currentTargetProgramId, setCurrentTargetProgramId] = useState<string>('wp-blank-001');
    const [activeWellDataTab, setActiveWellDataTab] = useState<string>('header');
    const [analogueProgramId, setAnalogueProgramId] = useState<string>('');
    const [newCasing, setNewCasing] = useState<Partial<CasingSchema>>({ casingId: '', size: '', weight: '', grade: '', shoeDepthMD: '', shoeDepthTVD: '' });
    const [newTreeValve, setNewTreeValve] = useState<Partial<TreeValve>>({ valve: '', type: '', status: 'Open' });
    const [newFluidColumn, setNewFluidColumn] = useState<Partial<FluidColumn>>({ fluidType: '', density: '', topDepth: '', bottomDepth: '' });
    const [showCasingForm, setShowCasingForm] = useState(false);
    const [showValveForm, setShowValveForm] = useState(false);
    const [showFluidLevelForm, setShowFluidLevelForm] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        dashboard: true,
        wellData: true,
        workflow: true,
        analogue: false,
        schematic: false,
        '3dview': false,
        jobLog: false,
        liveOps: false,
        documents: false,
        risk: false,
        resources: false,
        approvals: false,
    });
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
    const [calculationState, setCalculationState] = useState({ depth: '0', pressure: '0' });
    const [isFileProcessing, setIsFileProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showMocForm, setShowMocForm] = useState(false);
    const [showFluidForm, setShowFluidForm] = useState(false);
    const [surveyDataPreview, setSurveyDataPreview] = useState<DeviationSurveyStation[] | null>(null);
    const [csvParseError, setCsvParseError] = useState<string | null>(null);
    const [surveyInputText, setSurveyInputText] = useState<string>('');

    // --- DERIVED STATE ---
    const currentTargetProgram = useMemo(() => wellPrograms.find(p => p.id === currentTargetProgramId), [wellPrograms, currentTargetProgramId]);
    const analogueProgram = useMemo(() => wellPrograms.find(p => p.id === analogueProgramId), [wellPrograms, analogueProgramId]);
    const analogueWells = useMemo(() => wellPrograms.filter(p => p.id !== currentTargetProgramId), [wellPrograms, currentTargetProgramId]);

    useEffect(() => {
        if (currentTargetProgram) {
            setSurveyInputText(formatSurveyDataToString(currentTargetProgram.deviationSurvey));
        }
    }, [currentTargetProgram]);
    
    const initialMocState = {
        mocId: '',
        dateRequested: new Date().toISOString().split('T')[0],
        description: '',
        justification: '',
        approvals: '',
        status: 'Draft' as const,
    };
    const [newMocRecord, setNewMocRecord] = useState(initialMocState);
    
    const initialFluidState = {
        name: '',
        volume: '',
        purpose: '',
        permitStatus: 'Pending' as const,
    };
    const [newFluidMaterial, setNewFluidMaterial] = useState(initialFluidState);

    // --- EVENT HANDLERS ---
    const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentTargetProgramId(e.target.value);
        setAnalogueProgramId('');
        setHighlightedItemId(null);
    };
    const handleAnalogueChange = (e: React.ChangeEvent<HTMLSelectElement>) => setAnalogueProgramId(e.target.value);
    const toggleSection = (sectionId: string) => setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));

    const handleFieldChange = (path: string, value: any) => {
        if (!currentTargetProgram) return;
        const updatedProgram = set({ ...currentTargetProgram }, path, value);
        setWellPrograms(programs =>
            programs.map(p => (p.id === currentTargetProgramId ? updatedProgram : p))
        );
    };
    
    const handleTableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        handleFieldChange(name, value);
    };
    
    const handleAddListItem = <T extends { id: string }>(path: string, newItem: T) => {
        if (!currentTargetProgram) return;
        const list = (path.split('.').reduce((o, i) => o?.[i], currentTargetProgram) as T[]) || [];
        handleFieldChange(path, [...list, newItem]);
    };

    const handleDeleteListItem = (path: string, idToDelete: string) => {
        if (!currentTargetProgram) return;
        const list = (path.split('.').reduce((o, i) => o?.[i], currentTargetProgram) as {id: string}[]) || [];
        handleFieldChange(path, list.filter(item => item.id !== idToDelete));
    };
    
    const handleCopyLesson = (lesson: string, wellName: string) => {
        if (!currentTargetProgram) return;
        const newHazard = `[From ${wellName}]: ${lesson}`;
        const currentHazards = currentTargetProgram.risk.hazards || "";
        const updatedHazards = currentHazards ? `${currentHazards}\n\n${newHazard}` : newHazard;
        handleFieldChange('risk.hazards', updatedHazards);
        // Also add as an observation for visibility
        const newObs: KeyObservation = {
            id: `ko-lesson-${Date.now()}`,
            depth: 0,
            type: 'Hazard',
            description: `Analogue Risk (${wellName}): ${lesson}`
        };
        handleAddListItem('keyObservations', newObs);
        alert(`Lesson from ${wellName} added to Hazards and Key Observations.`);
    };
    
    const handleAddMocRecord = () => {
        if (!currentTargetProgram || !newMocRecord.mocId || !newMocRecord.description) return;
        const newRecord: MOCRecord = { id: `moc-${crypto.randomUUID()}`, ...newMocRecord };
        handleAddListItem('risk.moc', newRecord);
        setNewMocRecord(initialMocState);
        setShowMocForm(false);
    };
    
    const handleNewMocChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewMocRecord(prev => ({...prev, [name]: value}));
    };

    const handleAddFluidMaterial = () => {
        if (!currentTargetProgram || !newFluidMaterial.name || !newFluidMaterial.volume) return;
        const newFluid: FluidMaterial = { id: `fluid-${crypto.randomUUID()}`, ...newFluidMaterial };
        handleAddListItem('fluids', newFluid);
        setNewFluidMaterial(initialFluidState);
        setShowFluidForm(false);
    };

    const handleNewFluidChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewFluidMaterial(prev => ({...prev, [name]: value}));
    };

    const handleNewCasingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewCasing(prev => ({ ...prev, [name]: value }));
    };

    const handleNewValveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTreeValve(prev => ({ ...prev, [name]: value }));
    };

    const handleNewFluidLevelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewFluidColumn(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCasing = () => {
        const casing: CasingSchema = {
            id: `cs-${crypto.randomUUID()}`,
            casingId: newCasing.casingId || 'New Casing',
            size: newCasing.size || '',
            weight: newCasing.weight || '',
            grade: newCasing.grade || '',
            shoeDepthMD: newCasing.shoeDepthMD || '',
            shoeDepthTVD: newCasing.shoeDepthTVD || '',
        };
        handleAddListItem('casingSchema', casing);
        setNewCasing({ casingId: '', size: '', weight: '', grade: '', shoeDepthMD: '', shoeDepthTVD: '' });
        setShowCasingForm(false);
    };

    const handleAddValve = () => {
        const valve: TreeValve = {
            id: `tv-${crypto.randomUUID()}`,
            valve: newTreeValve.valve || 'New Valve',
            type: newTreeValve.type || '',
            status: (newTreeValve.status as TreeValve['status']) || 'Open',
        };
        handleAddListItem('wellStatus.treeValves', valve);
        setNewTreeValve({ valve: '', type: '', status: 'Open' });
        setShowValveForm(false);
    };

    const handleAddFluidLevel = () => {
        const fluid: FluidColumn = {
            id: `fc-${crypto.randomUUID()}`,
            fluidType: newFluidColumn.fluidType || 'New Fluid',
            density: newFluidColumn.density || '',
            topDepth: newFluidColumn.topDepth || '',
            bottomDepth: newFluidColumn.bottomDepth || '',
        };
        handleAddListItem('wellStatus.fluidLevels', fluid);
        setNewFluidColumn({ fluidType: '', density: '', topDepth: '', bottomDepth: '' });
        setShowFluidLevelForm(false);
    };

    const handleUpdateSurveyFromText = () => {
        const newSurveyData: DeviationSurveyStation[] = surveyInputText
            .split('\n')
            .map((line, index) => {
                const parts = line.split(',');
                if (parts.length === 3) {
                    const [md, incl, azim] = parts.map(parseFloat);
                    if (!isNaN(md) && !isNaN(incl) && !isNaN(azim)) {
                        return { id: `ds-${index + 1}`, md, incl, azim };
                    }
                }
                return null;
            })
            .filter((s): s is DeviationSurveyStation => s !== null);

        handleFieldChange('deviationSurvey', newSurveyData);
    };

    // Job Log CSV Upload Logic
    const handleJobLogCsvSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const lines = text.trim().split('\n');
                // Simple parser assuming standard order: Timestamp,Time_Minutes,Depth_ft,WHP_psi,Hookload_kips,Flow_Rate_bpm,Temperature_F,RPM,Torque_ftlbs,Status,Alerts
                // Skip Header
                const dataRows = lines.slice(1);
                const parsedLog: JobLogEntry[] = dataRows.map(line => {
                    const cols = line.split(',');
                    if(cols.length < 11) return null;
                    return {
                        timestamp: cols[0],
                        timeMinutes: parseFloat(cols[1]),
                        depth: parseFloat(cols[2]),
                        whp: parseFloat(cols[3]),
                        hookload: parseFloat(cols[4]),
                        flowRate: parseFloat(cols[5]),
                        temp: parseFloat(cols[6]),
                        rpm: parseFloat(cols[7]),
                        torque: parseFloat(cols[8]),
                        status: cols[9],
                        alerts: cols[10].replace('\r', ''),
                    };
                }).filter((d): d is JobLogEntry => d !== null);
                
                handleFieldChange('jobLog', parsedLog);
                alert(`Successfully imported ${parsedLog.length} log entries.`);
            } catch (err) {
                console.error(err);
                alert('Error parsing CSV. Please ensure format matches the template.');
            }
        };
        reader.readAsText(file);
    };

    const handleSurveyCsvSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        const fileInput = document.getElementById('survey-csv-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';

        if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
            setCsvParseError('Please upload a valid CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const lines = text.trim().split('\n');
                if (isNaN(parseFloat(lines[0].split(',')[0]))) lines.shift(); // Remove header

                const parsedData: DeviationSurveyStation[] = lines.map((line, index) => {
                    const parts = line.split(',');
                    if (parts.length !== 3) throw new Error(`Row ${index + 1} does not have 3 columns.`);
                    const [md, incl, azim] = parts.map(p => parseFloat(p.trim()));
                    if (isNaN(md) || isNaN(incl) || isNaN(azim)) throw new Error(`Row ${index + 1} contains non-numeric data.`);
                    return { id: `preview-ds-${index}`, md, incl, azim };
                });
                
                setSurveyDataPreview(parsedData);
                setCsvParseError(null);
            } catch (error: any) {
                setCsvParseError(`Error parsing CSV: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };
    
    const confirmSurveyImport = () => {
        if (!surveyDataPreview) return;
        const surveyWithProperIds = surveyDataPreview.map((s, i) => ({...s, id: `ds-${i + 1}`}));
        handleFieldChange('deviationSurvey', surveyWithProperIds);
        setSurveyInputText(formatSurveyDataToString(surveyWithProperIds));
        setSurveyDataPreview(null);
    };
    
    const cancelSurveyImport = () => {
        setSurveyDataPreview(null);
        setCsvParseError(null);
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0 || !currentTargetProgram) return;
        setIsFileProcessing(true);
        const filePromises = Array.from(files).map(file => {
            return new Promise<UploadedFile>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        id: `file-${crypto.randomUUID()}`,
                        name: file.name,
                        type: file.type || 'unknown',
                        size: file.size,
                        uploadDate: new Date().toISOString(),
                        content: file.type.startsWith('text/') ? (e.target?.result as string) : '[Non-text content]',
                    });
                };
                reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));
                reader.readAsText(file);
            });
        });
        Promise.all(filePromises).then(newFiles => {
            handleFieldChange('uploadedFiles', [...(currentTargetProgram.uploadedFiles || []), ...newFiles]);
        }).catch(console.error).finally(() => setIsFileProcessing(false));
    };
    
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
        else if (e.type === 'dragleave') setIsDragging(false);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) handleFileSelect(e.dataTransfer.files);
    };
    
    const handleCalculationChange = useCallback((depth: string, pressure: string) => setCalculationState({ depth, pressure }), []);
    
    const handleAddObservation = useCallback((depth: number) => {
        if (!currentTargetProgram) return;
        const newObservation: KeyObservation = {
            id: `ko-${crypto.randomUUID()}`,
            depth: Math.round(depth),
            type: 'Note',
            description: 'New observation from schematic.'
        };
        handleAddListItem('keyObservations', newObservation);
        setHighlightedItemId(newObservation.id);
    }, [currentTargetProgram]);
    
    // --- RENDER LOGIC ---
    if (!currentTargetProgram) {
        return <div className="p-8 text-center text-gray-400">Select a well program to begin.</div>;
    }

    return (
        <div className="bg-slate-900 min-h-screen">
            <header className="bg-slate-800 shadow-lg p-4 sticky top-0 z-50 border-b border-slate-700">
                <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-100">Well Intervention Planner</h1>
                     <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <label htmlFor="target-well" className="text-sm font-medium text-gray-400">Target Well:</label>
                            <select id="target-well" value={currentTargetProgramId} onChange={handleProgramChange} className="p-2 border bg-slate-700 border-slate-600 rounded-md text-gray-200">
                                {wellPrograms.map(p => <option key={p.id} value={p.id}>{p.wellHeader.wellName}</option>)}
                            </select>
                        </div>
                         <div className="flex items-center space-x-2">
                            <label htmlFor="analogue-well" className="text-sm font-medium text-gray-400">Compare Analogue:</label>
                            <select id="analogue-well" value={analogueProgramId} onChange={handleAnalogueChange} className="p-2 border bg-slate-700 border-slate-600 rounded-md text-gray-200">
                                <option value="">Select Analogue</option>
                                {analogueWells.map(p => <option key={p.id} value={p.id}>{p.wellHeader.wellName}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-screen-2xl mx-auto space-y-8">
                
                <Section title="Program Overview & Dashboard" description={`Live status for program ${currentTargetProgram.wellHeader.programTitle}`} isOpen={openSections.dashboard} onClick={() => toggleSection('dashboard')}>
                    <ProgramDashboard program={currentTargetProgram} />
                </Section>
                
                <Section title="Well Identification & Data" description="Manage well header, trajectory, schematics, and status." isOpen={openSections.wellData} onClick={() => toggleSection('wellData')}>
                    <div className="space-y-6">
                        {/* Sub-Tabs Navigation */}
                        <div className="flex border-b border-slate-700 mb-6 overflow-x-auto scrollbar-hide">
                            {wellDataTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveWellDataTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                                        activeWellDataTab === tab.id
                                            ? 'border-blue-500 text-blue-400 bg-blue-900/10'
                                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[300px] relative">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeWellDataTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeWellDataTab === 'header' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <InputField label="Well Name" id="wh-name" name="wellHeader.wellName" value={currentTargetProgram.wellHeader.wellName} onChange={handleTableChange} />
                                            <InputField label="Unique Identifier" id="wh-uwi" name="wellHeader.uniqueIdentifier" value={currentTargetProgram.wellHeader.uniqueIdentifier} onChange={handleTableChange} />
                                            <InputField label="Field Block" id="wh-field" name="wellHeader.fieldBlock" value={currentTargetProgram.wellHeader.fieldBlock} onChange={handleTableChange} />
                                            <InputField label="Well Type" id="wh-type" name="wellHeader.wellType" value={currentTargetProgram.wellHeader.wellType} onChange={handleTableChange} />
                                            <InputField label="Rig Name" id="wh-rig" name="wellHeader.rig" value={currentTargetProgram.wellHeader.rig} onChange={handleTableChange} />
                                            <InputField label="Program Title" id="wh-title" name="wellHeader.programTitle" value={currentTargetProgram.wellHeader.programTitle} onChange={handleTableChange} />
                                        </div>
                                    )}

                                    {activeWellDataTab === 'trajectory' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <InputField label="Surface Coordinates" id="wt-coords" name="wellTrajectory.surfaceCoordinates" value={currentTargetProgram.wellTrajectory.surfaceCoordinates} onChange={handleTableChange} placeholder="X: 000, Y: 000" />
                                            <InputField label="Water Depth" id="wt-wd" name="wellTrajectory.waterDepth" value={currentTargetProgram.wellTrajectory.waterDepth} onChange={handleTableChange} unit="ft" type="number" min={0} helperText="Depth of water at well location." />
                                            <InputField label="Rig Heading" id="wt-heading" name="wellTrajectory.rigHeading" value={currentTargetProgram.wellTrajectory.rigHeading} onChange={handleTableChange} unit="deg" type="number" min={0} max={360} helperText="Orientation of the rig (0-360°)." />
                                            <InputField label="Wellhead Datum" id="wt-datum" name="wellTrajectory.wellheadDatum" value={currentTargetProgram.wellTrajectory.wellheadDatum} onChange={handleTableChange} placeholder="e.g. RKB" />
                                        </div>
                                    )}

                                    {activeWellDataTab === 'casing' && (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase">Casing Strings</h4>
                                                <button onClick={() => setShowCasingForm(!showCasingForm)} className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center">
                                                    <PlusCircleIcon /> {showCasingForm ? 'Cancel' : 'Add Casing'}
                                                </button>
                                            </div>
                                            
                                            {showCasingForm && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="p-4 bg-slate-800 border border-slate-700 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden"
                                                >
                                                    <InputField label="Casing ID" id="casingId" name="casingId" value={newCasing.casingId} onChange={handleNewCasingChange} placeholder="e.g. Surface" />
                                                    <InputField label="Size (in)" id="size" name="size" value={newCasing.size} onChange={handleNewCasingChange} placeholder='e.g. 13 3/8"' />
                                                    <InputField label="Weight (ppf)" id="weight" name="weight" value={newCasing.weight} onChange={handleNewCasingChange} />
                                                    <InputField label="Grade" id="grade" name="grade" value={newCasing.grade} onChange={handleNewCasingChange} />
                                                    <InputField label="Shoe MD (ft)" id="shoeDepthMD" name="shoeDepthMD" value={newCasing.shoeDepthMD} onChange={handleNewCasingChange} type="number" />
                                                    <InputField label="Shoe TVD (ft)" id="shoeDepthTVD" name="shoeDepthTVD" value={newCasing.shoeDepthTVD} onChange={handleNewCasingChange} type="number" />
                                                    <div className="md:col-span-3 flex justify-end">
                                                        <button onClick={handleAddCasing} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Add String</button>
                                                    </div>
                                                </motion.div>
                                            )}

                                            <div className="overflow-x-auto">
                                                <table className="min-w-full bg-slate-800 border border-slate-700">
                                                    <thead className="bg-slate-700">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Size</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Weight</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Grade</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Shoe MD</th>
                                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-700">
                                                        {currentTargetProgram.casingSchema.map(cs => (
                                                            <tr key={cs.id}>
                                                                <td className="p-2 text-sm">{cs.casingId}</td>
                                                                <td className="p-2 text-sm">{cs.size}</td>
                                                                <td className="p-2 text-sm">{cs.weight}</td>
                                                                <td className="p-2 text-sm">{cs.grade}</td>
                                                                <td className="p-2 text-sm font-mono">{cs.shoeDepthMD} ft</td>
                                                                <td className="p-2 text-center">
                                                                    <button onClick={() => handleDeleteListItem('casingSchema', cs.id)} className="text-red-500 hover:text-red-400"><TrashIcon /></button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {currentTargetProgram.casingSchema.length === 0 && (
                                                            <tr><td colSpan={6} className="p-4 text-center text-gray-500 text-sm">No casing strings defined.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {activeWellDataTab === 'tubing' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <InputField label="Tubing Size (in)" id="ts-size" name="tubingSchema.size" value={currentTargetProgram.tubingSchema.size} onChange={handleTableChange} placeholder='e.g. 3 1/2"' />
                                            <InputField label="Weight (ppf)" id="ts-weight" name="tubingSchema.weight" value={currentTargetProgram.tubingSchema.weight} onChange={handleTableChange} />
                                            <InputField label="Grade" id="ts-grade" name="tubingSchema.grade" value={currentTargetProgram.tubingSchema.grade} onChange={handleTableChange} />
                                            <InputField label="Setting Depth (ft MD)" id="ts-depth" name="tubingSchema.settingDepth" value={currentTargetProgram.tubingSchema.settingDepth} onChange={handleTableChange} type="number" />
                                            <InputField label="PBR Depth (ft MD)" id="ts-pbr" name="tubingSchema.pbrDepth" value={currentTargetProgram.tubingSchema.pbrDepth} onChange={handleTableChange} type="number" />
                                        </div>
                                    )}

                                    {activeWellDataTab === 'reservoir' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InputField label="Reservoir Pressure (psi)" id="res-press" name="reservoirData.pressure" value={currentTargetProgram.reservoirData.pressure} onChange={handleTableChange} type="number" unit="psi" />
                                            <InputField label="Reservoir Temperature (°F)" id="res-temp" name="reservoirData.temperature" value={currentTargetProgram.reservoirData.temperature} onChange={handleTableChange} type="number" unit="°F" />
                                            <InputField label="Reservoir Fluids" id="res-fluids" name="reservoirData.fluids" value={currentTargetProgram.reservoirData.fluids} onChange={handleTableChange} placeholder="e.g. Oil, Gas, Water" />
                                            <InputField label="OOWC (ft TVD)" id="res-oowc" name="reservoirData.oowc" value={currentTargetProgram.reservoirData.oowc} onChange={handleTableChange} type="number" unit="ft TVD" />
                                        </div>
                                    )}

                                    {activeWellDataTab === 'status' && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <InputField as="textarea" label="Suspension Details" id="ws-suspension" name="wellStatus.suspensionDetails" value={currentTargetProgram.wellStatus.suspensionDetails} onChange={handleTableChange} />
                                                <InputField label="SIHWP (psi)" id="ws-sihwp" name="wellStatus.sihwp" value={currentTargetProgram.wellStatus.sihwp} onChange={handleTableChange} type="number" unit="psi" />
                                            </div>

                                            {/* Tree Valves */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-semibold text-gray-400 uppercase">Tree Valves</h4>
                                                    <button onClick={() => setShowValveForm(!showValveForm)} className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center">
                                                        <PlusCircleIcon /> {showValveForm ? 'Cancel' : 'Add Valve'}
                                                    </button>
                                                </div>
                                                {showValveForm && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        className="p-4 bg-slate-800 border border-slate-700 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden"
                                                    >
                                                        <InputField label="Valve Name" id="valve" name="valve" value={newTreeValve.valve} onChange={handleNewValveChange} placeholder="e.g. UMV" />
                                                        <InputField label="Type" id="valveType" name="type" value={newTreeValve.type} onChange={handleNewValveChange} placeholder="e.g. Gate" />
                                                        <InputField as="select" label="Status" id="valveStatus" name="status" value={newTreeValve.status} onChange={handleNewValveChange}>
                                                            <option>Open</option><option>Closed</option><option>Checked</option>
                                                        </InputField>
                                                        <div className="md:col-span-3 flex justify-end">
                                                            <button onClick={handleAddValve} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Add Valve</button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                    {currentTargetProgram.wellStatus.treeValves.map(valve => (
                                                        <div key={valve.id} className="p-3 bg-slate-800 border border-slate-700 rounded-md relative group">
                                                            <div className="text-xs font-bold text-gray-500 uppercase">{valve.valve}</div>
                                                            <div className="text-sm font-semibold text-gray-200">{valve.type}</div>
                                                            <div className={`text-xs mt-1 ${valve.status === 'Open' ? 'text-green-400' : 'text-red-400'}`}>{valve.status}</div>
                                                            <button onClick={() => handleDeleteListItem('wellStatus.treeValves', valve.id)} className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Fluid Levels */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-sm font-semibold text-gray-400 uppercase">Fluid Levels</h4>
                                                    <button onClick={() => setShowFluidLevelForm(!showFluidLevelForm)} className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center">
                                                        <PlusCircleIcon /> {showFluidLevelForm ? 'Cancel' : 'Add Fluid Level'}
                                                    </button>
                                                </div>
                                                {showFluidLevelForm && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        className="p-4 bg-slate-800 border border-slate-700 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden"
                                                    >
                                                        <InputField label="Fluid Type" id="fluidType" name="fluidType" value={newFluidColumn.fluidType} onChange={handleNewFluidLevelChange} />
                                                        <InputField label="Density (ppg)" id="density" name="density" value={newFluidColumn.density} onChange={handleNewFluidLevelChange} type="number" />
                                                        <InputField label="Top MD (ft)" id="topDepth" name="topDepth" value={newFluidColumn.topDepth} onChange={handleNewFluidLevelChange} type="number" />
                                                        <InputField label="Bottom MD (ft)" id="bottomDepth" name="bottomDepth" value={newFluidColumn.bottomDepth} onChange={handleNewFluidLevelChange} type="number" />
                                                        <div className="md:col-span-4 flex justify-end">
                                                            <button onClick={handleAddFluidLevel} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Add Fluid Level</button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full bg-slate-800 border border-slate-700">
                                                        <thead className="bg-slate-700">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Fluid Type</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Density</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Top MD</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Bottom MD</th>
                                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-700">
                                                            {currentTargetProgram.wellStatus.fluidLevels.map(fluid => (
                                                                <tr key={fluid.id}>
                                                                    <td className="p-2 text-sm">{fluid.fluidType}</td>
                                                                    <td className="p-2 text-sm font-mono">{fluid.density} ppg</td>
                                                                    <td className="p-2 text-sm font-mono">{fluid.topDepth} ft</td>
                                                                    <td className="p-2 text-sm font-mono">{fluid.bottomDepth} ft</td>
                                                                    <td className="p-2 text-center">
                                                                        <button onClick={() => handleDeleteListItem('wellStatus.fluidLevels', fluid.id)} className="text-red-500 hover:text-red-400"><TrashIcon /></button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </Section>

                <Section title="Operational Workflow" description="Step-by-step procedures for the well intervention program." isOpen={openSections.workflow} onClick={() => toggleSection('workflow')}>
                    <div className="space-y-6">
                        {currentTargetProgram.phases.map(phase => (
                            <div key={phase.id} className={`p-4 rounded-lg border-l-4 ${phase.status === 'Active' ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-800 border-slate-600'}`}>
                                <h3 className="text-lg font-bold text-gray-100 flex items-center">
                                    {phase.status === 'Active' && <Spinner />}
                                    {phase.name}
                                    <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${ {Complete: 'bg-green-600', Active: 'bg-blue-600', Next: 'bg-yellow-600'}[phase.status || ''] || 'bg-gray-700'}`}>{phase.status || 'Locked'}</span>
                                </h3>
                                {phase.procedure && (
                                    <pre className="mt-2 text-sm text-gray-300 whitespace-pre-wrap font-sans bg-slate-900/50 p-3 rounded-md border border-slate-700">
                                        {phase.procedure}
                                    </pre>
                                )}
                            </div>
                        ))}
                         {currentTargetProgram.phases.length === 0 && <p className="text-sm text-gray-400">No operational phases defined for this plan.</p>}
                    </div>
                </Section>
                
                <Section title="Analogue Intelligence & Lessons Learned" description="Review insights from the 6 analogue wells provided in the site study." isOpen={openSections.analogue} onClick={() => toggleSection('analogue')}>
                    <AnalogueIntelligence analogues={analogueWells} onCopyLesson={handleCopyLesson} />
                </Section>

                <Section title="Wellbore Schematic" description="Interactive view of the wellbore. Click items to highlight, scroll to zoom, drag to pan." isOpen={openSections.schematic} onClick={() => toggleSection('schematic')}>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2">
                            <WellboreSchematicViewer
                                program={currentTargetProgram}
                                analogueProgram={analogueProgram || null}
                                highlightedItemId={highlightedItemId}
                                hoveredItemId={hoveredItemId}
                                onItemClick={setHighlightedItemId}
                                onItemMouseEnter={setHoveredItemId}
                                onItemMouseLeave={() => setHoveredItemId(null)}
                                onAddObservation={handleAddObservation}
                                calculationDepth={calculationState.depth}
                                hydrostaticPressure={calculationState.pressure}
                            />
                        </div>
                        <div className="space-y-4">
                           <EngineeringCalculators program={currentTargetProgram} onCalculationChange={handleCalculationChange} />
                        </div>
                    </div>
                </Section>
                
                <Section title="3D Wellbore Visualization" description="Input deviation survey data (MD, Incl, Azim) to render the well path." isOpen={openSections['3dview']} onClick={() => toggleSection('3dview')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-2">Deviation Survey Data</h3>
                            <p className="text-sm text-gray-400 mb-2">Format: MD,Inclination,Azimuth per line.</p>
                            <textarea
                                value={surveyInputText}
                                onChange={(e) => setSurveyInputText(e.target.value)}
                                className="w-full h-64 font-mono text-sm p-2 border border-slate-600 rounded-md bg-slate-900 text-gray-200"
                                placeholder="0,0,0&#10;1000,0,0&#10;2000,5,45&#10;..."
                            />
                            <div className="mt-2 flex items-center space-x-2">
                                <button onClick={handleUpdateSurveyFromText} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Update from Text</button>
                                <label htmlFor="survey-csv-upload" className="px-4 py-2 text-sm font-medium text-gray-200 bg-slate-700 border border-slate-600 rounded-md hover:bg-slate-600 cursor-pointer">Upload CSV</label>
                                <input type="file" id="survey-csv-upload" className="hidden" accept=".csv,text/csv" onChange={(e) => handleSurveyCsvSelect(e.target.files)} />
                            </div>
                            {csvParseError && <p className="mt-2 text-sm text-red-500">{csvParseError}</p>}
                        </div>
                        <div className="min-h-[400px]"><Wellbore3DViewer program={currentTargetProgram} /></div>
                    </div>
                </Section>

                <Section title="Job Execution Analysis" description="Detailed visualization of trip speed, mechanics, and alerts from job logs." isOpen={openSections.jobLog} onClick={() => toggleSection('jobLog')}>
                    <div>
                         <div className="flex justify-end mb-4">
                            <label className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer flex items-center">
                                <TableIcon /> <span className="ml-2">Upload Job Log CSV</span>
                                <input type="file" className="hidden" accept=".csv" onChange={(e) => handleJobLogCsvSelect(e.target.files)} />
                            </label>
                        </div>
                        <JobLogAnalysis program={currentTargetProgram} />
                    </div>
                </Section>

                <Section title="Live Operations" description="Monitor real-time data, review event logs, and leverage AI for anomaly detection." isOpen={openSections.liveOps} onClick={() => toggleSection('liveOps')}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LiveOperationsLog dailyReports={currentTargetProgram.dailyReports} />
                        <AIAnomalyDetector program={currentTargetProgram} />
                    </div>
                </Section>
                
                <Section title="Document & Data Management" description="Upload reference files (reports, logs, etc.) to be used by the AI." isOpen={openSections.documents} onClick={() => toggleSection('documents')}>
                    <div className={`relative p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-900/50' : 'border-slate-600 bg-slate-800/50'}`} onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents} onDrop={handleDrop} onClick={() => document.getElementById('file-upload-input')?.click()}>
                        <input type="file" id="file-upload-input" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                        {isFileProcessing ? (<div className="flex items-center text-blue-400"><Spinner /><span>Processing files...</span></div>) : (<div className="flex flex-col items-center justify-center text-gray-400"><UploadIcon /><p className="mt-2 font-semibold">{isDragging ? 'Drop files to upload' : 'Drag & drop files here, or click to select'}</p></div>)}
                    </div>
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-200">Uploaded Files</h4>
                        {currentTargetProgram.uploadedFiles.length === 0 ? (<p className="text-sm text-gray-500 mt-2">No files uploaded.</p>) : (
                            <ul className="mt-4 space-y-3">
                                {currentTargetProgram.uploadedFiles.map(file => (
                                    <li key={file.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-md border border-slate-600">
                                        <div className="flex items-center space-x-3">{getFileIcon(file.type)}<div><p className="font-medium text-gray-200">{file.name}</p><p className="text-xs text-gray-400">{formatFileSize(file.size)}</p></div></div>
                                        <button onClick={() => handleDeleteListItem('uploadedFiles', file.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full"><TrashIcon /></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Section>
                <Section title="Risk & Compliance" description="Manage hazards, management of change, and permits." isOpen={openSections.risk} onClick={() => toggleSection('risk')}>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-2">Hazards & Mitigations</h3>
                            <InputField as="textarea" id="risk.hazards" name="risk.hazards" label="Describe known hazards and planned mitigations." value={currentTargetProgram.risk.hazards} onChange={handleTableChange} />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-gray-200">Management of Change (MOC)</h3>
                                <button onClick={() => setShowMocForm(!showMocForm)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{showMocForm ? 'Cancel' : 'Add MOC Record'}</button>
                            </div>
                            {showMocForm && (
                                <div className="p-4 mt-4 bg-slate-700/50 border border-slate-600 rounded-lg space-y-4">
                                    <h4 className="font-semibold">New MOC Record</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <InputField label="MOC ID" id="mocId" name="mocId" value={newMocRecord.mocId} onChange={handleNewMocChange} />
                                        <InputField label="Date Requested" id="dateRequested" name="dateRequested" type="date" value={newMocRecord.dateRequested} onChange={handleNewMocChange}/>
                                        <InputField as="select" label="Status" id="status" name="status" value={newMocRecord.status} onChange={handleNewMocChange}>
                                            <option>Draft</option><option>Pending Approval</option><option>Approved</option><option>Rejected</option><option>Closed</option>
                                        </InputField>
                                    </div>
                                    <InputField as="textarea" label="Description" id="description" name="description" value={newMocRecord.description} onChange={handleNewMocChange}/>
                                    <InputField as="textarea" label="Justification" id="justification" name="justification" value={newMocRecord.justification} onChange={handleNewMocChange}/>
                                    <InputField as="textarea" label="Approvals" id="approvals" name="approvals" value={newMocRecord.approvals} onChange={handleNewMocChange}/>
                                    <div className="flex justify-end"><button onClick={handleAddMocRecord} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Save Record</button></div>
                                </div>
                            )}
                            <div className="mt-4 overflow-x-auto">
                                {(currentTargetProgram.risk.moc || []).length > 0 ? (
                                    <table className="min-w-full bg-slate-800 border border-slate-700"><thead className="bg-slate-700"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">MOC ID</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th><th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th></tr></thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {currentTargetProgram.risk.moc.map(moc => (<tr key={moc.id}><td className="p-2 font-medium">{moc.mocId}</td><td className="p-2 text-gray-400">{moc.dateRequested}</td><td className="p-2 text-gray-400 max-w-sm truncate">{moc.description}</td><td className="p-2"><MocStatusBadge status={moc.status} /></td><td className="p-2 text-center"><button onClick={() => handleDeleteListItem('risk.moc', moc.id)} className="text-red-500 hover:text-red-400"><TrashIcon /></button></td></tr>))}
                                        </tbody>
                                    </table>) : (<p className="text-sm text-gray-500 mt-2">No MOC records found.</p>)}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-2">Permits</h3>
                            <InputField as="textarea" id="risk.permits" name="risk.permits" label="Describe the status of all required permits." value={currentTargetProgram.risk.permits} onChange={handleTableChange} />
                        </div>
                    </div>
                </Section>

                <Section title="Resources & Logistics" description="Manage equipment, fluids, materials, and personnel for the operation." isOpen={openSections.resources} onClick={() => toggleSection('resources')}>
                    <div className="space-y-8">
                        {/* Fluids & Materials Subsection */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-gray-200">Fluids & Materials</h3>
                                <button onClick={() => setShowFluidForm(!showFluidForm)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{showFluidForm ? 'Cancel' : 'Add Fluid/Material'}</button>
                            </div>
                            {showFluidForm && (
                                <div className="p-4 mt-4 bg-slate-700/50 border border-slate-600 rounded-lg space-y-4">
                                    <h4 className="font-semibold">New Fluid / Material Record</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Name" id="fluidName" name="name" value={newFluidMaterial.name} onChange={handleNewFluidChange} placeholder="e.g., 10.5 ppg NaCl Brine" />
                                        <InputField label="Volume" id="fluidVolume" name="volume" value={newFluidMaterial.volume} onChange={handleNewFluidChange} placeholder="e.g., 500 bbls" />
                                    </div>
                                    <InputField as="textarea" label="Purpose" id="fluidPurpose" name="purpose" value={newFluidMaterial.purpose} onChange={handleNewFluidChange} placeholder="e.g., Well kill fluid, spacer, etc." />
                                    <InputField as="select" label="Permit Status" id="permitStatus" name="permitStatus" value={newFluidMaterial.permitStatus} onChange={handleNewFluidChange}>
                                        <option>Pending</option><option>Approved</option><option>Not Required</option>
                                    </InputField>
                                    <div className="flex justify-end"><button onClick={handleAddFluidMaterial} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Save Fluid</button></div>
                                </div>
                            )}
                            <div className="mt-4 overflow-x-auto">
                                {(currentTargetProgram.fluids || []).length > 0 ? (
                                    <table className="min-w-full bg-slate-800 border border-slate-700">
                                        <thead className="bg-slate-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Volume</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Purpose</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Permit Status</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {currentTargetProgram.fluids.map(fluid => (
                                                <tr key={fluid.id}>
                                                    <td className="p-2 font-medium">{fluid.name}</td>
                                                    <td className="p-2 text-gray-400">{fluid.volume}</td>
                                                    <td className="p-2 text-gray-400 max-w-sm truncate">{fluid.purpose}</td>
                                                    <td className="p-2"><PermitStatusBadge status={fluid.permitStatus} /></td>
                                                    <td className="p-2 text-center"><button onClick={() => handleDeleteListItem('fluids', fluid.id)} className="text-red-500 hover:text-red-400"><TrashIcon /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (<p className="text-sm text-gray-500 mt-2">No fluids or materials listed for this program.</p>)}
                            </div>
                        </div>
                    </div>
                </Section>
                <Section title="Document Approvals" description="Sign-off and authorization for the well program." isOpen={openSections.approvals} onClick={() => toggleSection('approvals')}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-slate-800 border border-slate-700">
                            <thead className="bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Signature</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {currentTargetProgram.approvals.map(approval => (
                                    <tr key={approval.id}>
                                        <td className="p-4 font-medium">{approval.role}</td>
                                        <td className="p-4 text-gray-400">{approval.name}</td>
                                        <td className="p-4 text-gray-300 font-mono italic">{approval.signature}</td>
                                        <td className="p-4 text-gray-400">{approval.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {currentTargetProgram.approvals.length === 0 && <p className="text-sm text-gray-500 mt-2 p-4">No approvals recorded.</p>}
                    </div>
                </Section>

            </main>
            {surveyDataPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b border-slate-600"><h3 className="text-lg font-semibold text-gray-100">Confirm Survey Data Import</h3></div>
                        <div className="p-4 overflow-y-auto">
                            <table className="min-w-full divide-y divide-slate-600"><thead className="bg-slate-700 sticky top-0"><tr><th>MD (ft)</th><th>Inclination (°)</th><th>Azimuth (°)</th></tr></thead>
                                <tbody className="bg-slate-800 divide-y divide-slate-600">
                                    {surveyDataPreview.map((row, index) => (<tr key={index}><td className="text-center py-2">{row.md.toFixed(2)}</td><td className="text-center py-2">{row.incl.toFixed(2)}</td><td className="text-center py-2">{row.azim.toFixed(2)}</td></tr>))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-600 bg-slate-800 flex justify-end space-x-3">
                            <button onClick={cancelSurveyImport} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500">Cancel</button>
                            <button onClick={confirmSurveyImport} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white">Confirm & Import</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
