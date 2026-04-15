
// constants.ts
// This file defines static data used to initialize and populate the application.

import { WellProgram } from './types';

/**
 * A predefined list of common oil and gas service vendors.
 */
export const COMMON_VENDORS = [
  'Schlumberger (SLB)',
  'Halliburton',
  'Baker Hughes',
  'Weatherford International',
  'NOV Inc.',
  'TechnipFMC',
  'Saipem',
  'Transocean',
  'Valaris',
  'Helmerich & Payne (H&P)',
  'Nabors Industries',
  'Patterson-UTI Energy',
  'Expro Group',
  'Core Laboratories',
  'Oceaneering International',
  'Subsea 7',
  'Aker Solutions',
  'FMC Technologies',
  'Cameron (a Schlumberger company)',
];

/**
 * An array of initial well program data to populate the application on first load.
 * DATASET: BLANK SHEET FOR PLANNING
 */
export const INITIAL_WELL_PROGRAMS: WellProgram[] = [
  {
    id: 'wp-blank-001',
    wellHeader: {
      wellName: 'New Well Program',
      uniqueIdentifier: '',
      fieldBlock: '',
      wellType: '',
      rig: '',
      programTitle: 'Well Intervention Plan',
      documentId: 'DOC-NEW-001',
    },
    issueRevisionLog: [
      { id: 'rev-1', status: 'Draft', revision: '01', date: new Date().toISOString().split('T')[0], description: 'Initial Plan' },
    ],
    wellTrajectory: {
      surfaceCoordinates: 'X: 456,789, Y: 1,234,567',
      waterDepth: '450',
      rigHeading: '180',
      wellheadDatum: 'RKB',
    },
    deviationSurvey: [],
    casingSchema: [
      { id: 'cs-1', casingId: 'Surface', size: '13 3/8"', weight: '68', grade: 'K-55', shoeDepthMD: '1500', shoeDepthTVD: '1500' },
      { id: 'cs-2', casingId: 'Production', size: '9 5/8"', weight: '47', grade: 'L-80', shoeDepthMD: '8500', shoeDepthTVD: '8200' },
    ],
    tubingSchema: {
      size: '3 1/2"',
      weight: '9.2',
      grade: 'L-80',
      settingDepth: '8400',
      pbrDepth: '8350',
    },
    reservoirData: {
      pressure: '3500',
      temperature: '185',
      fluids: 'Oil/Gas',
      oowc: '8600',
    },
    wellStatus: {
      suspensionDetails: 'Well suspended with mechanical plugs in 2022.',
      treeValves: [
        { id: 'tv-1', valve: 'UMV', type: 'Gate', status: 'Closed' },
        { id: 'tv-2', valve: 'LMV', type: 'Gate', status: 'Closed' },
        { id: 'tv-3', valve: 'WV', type: 'Gate', status: 'Closed' },
      ],
      sihwp: '450',
      fluidLevels: [
        { id: 'fc-1', fluidType: 'Brine', density: '10.2', topDepth: '0', bottomDepth: '4500' },
      ],
    },
    objectives: {
      core: '',
      goals: [],
    },
    phases: [],
    equipment: [],
    fluids: [],
    personnel: [],
    risk: {
      hazards: '',
      moc: [],
      permits: '',
    },
    afe: [],
    dailyReports: [],
    liveOperationsData: [],
    jobLog: [],
    keyObservations: [],
    schematicDescription: 'Blank well program ready for planning.',
    completionTally: [],
    pluggingTally: [],
    closeout: {
        performanceSummary: '',
        nptBreakdown: [],
        vendorScorecards: [],
        lessonsLearned: ''
    },
    uploadedFiles: [],
    approvals: [],
  },
];

/**
 * Factory function to create a new, empty well program object.
 */
export const createNewWellProgram = (wellName: string): WellProgram => {
    const newId = `wp-${crypto.randomUUID()}`;
    return {
        id: newId,
        wellHeader: {
            wellName: wellName,
            uniqueIdentifier: `API-${Math.floor(Math.random() * 1e10)}`,
            fieldBlock: '',
            wellType: 'Workover',
            rig: '',
            programTitle: `${wellName} Intervention Program`,
            documentId: `DOC-${wellName.replace(/\s+/g, '')}-V1`,
        },
        issueRevisionLog: [{ id: 'rev-1', status: 'Draft', revision: 'A', date: new Date().toISOString().split('T')[0], description: 'Initial Draft' }],
        wellTrajectory: { surfaceCoordinates: '', waterDepth: '', rigHeading: '', wellheadDatum: '' },
        deviationSurvey: [],
        casingSchema: [],
        tubingSchema: { size: '', weight: '', grade: '', settingDepth: '', pbrDepth: '' },
        reservoirData: { pressure: '', temperature: '', fluids: '', oowc: '' },
        wellStatus: {
            suspensionDetails: '',
            treeValves: [],
            sihwp: '',
            fluidLevels: [],
        },
        objectives: { core: '', goals: [] },
        phases: [],
        equipment: [],
        fluids: [],
        personnel: [],
        risk: { hazards: '', moc: [], permits: '' },
        afe: [],
        dailyReports: [],
        liveOperationsData: [],
        jobLog: [],
        keyObservations: [],
        schematicDescription: 'New well program.',
        completionTally: [],
        pluggingTally: [],
        closeout: { performanceSummary: '', nptBreakdown: [], vendorScorecards: [], lessonsLearned: '' },
        uploadedFiles: [],
        approvals: [],
    };
};
