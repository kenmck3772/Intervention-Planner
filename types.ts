
// types.ts
// This file defines all TypeScript types and interfaces used throughout the WellTegra application.
// Documenting these types is crucial for maintainability and for new developers to understand the data structures.

/**
 * Represents a validation issue found within the well program.
 * Used to flag potential errors or warnings to the user.
 */
export interface PlanIssue {
  id: string;
  level: 'error' | 'warning';
  message: string;
  sourceId: string; // The ID of the component causing the issue (e.g., a specific casing string's ID)
  sourceField?: string; // The specific field of the component with the issue (e.g., 'shoeDepthTVD')
}

/**
 * Represents a file uploaded by the user for reference.
 * The content is stored for potential analysis or use by the AI.
 */
export interface UploadedFile {
  id: string;
  name: string;
  type: string; // MIME type of the file
  size: number; // Size in bytes
  uploadDate: string; // ISO 8601 date string
  content: string; // Full content for text-based files, or a placeholder for binary files
}

/**
 * Core identification details for the well program.
 */
export interface WellHeader {
  wellName: string;
  uniqueIdentifier: string; // e.g., API Number
  fieldBlock: string; // The geographic or administrative block of the well
  wellType: string; // e.g., 'Horizontal Oil Producer', 'Vertical Gas Injector'
  rig: string;
  programTitle: string;
  documentId: string; // Internal document tracking ID
}

/**
 * Tracks a single revision of the well program document.
 */
export interface Revision {
  id: string;
  status: 'Draft' | 'Approved' | 'Superseded';
  revision: string; // e.g., 'A', 'B', '1', '2'
  date: string; // YYYY-MM-DD
  description: string;
}

/**
 * Positional and directional data for the wellhead.
 */
export interface WellTrajectory {
  surfaceCoordinates: string; // e.g., 'X: 12345, Y: 67890'
  waterDepth: string; // e.g., '6200 ft'
  rigHeading: string; // e.g., '210 deg'
  wellheadDatum: string; // Reference point for all depth measurements, e.g., 'RKB @ 125 ft above MSL'
}

/**
 * Defines a single string of casing in the wellbore.
 */
export interface CasingSchema {
  id: string;
  casingId: string; // User-defined name, e.g., 'Surface Casing', '36"'
  size: string; // Outer diameter in inches
  weight: string; // Weight in pounds per foot (ppf)
  grade: string; // Steel grade, e.g., 'L80', 'P110'
  shoeDepthMD: string; // Measured Depth of the casing shoe in feet
  shoeDepthTVD: string; // True Vertical Depth of the casing shoe in feet
}

/**
 * Defines the production tubing string.
 */
export interface TubingSchema {
  size: string; // Outer diameter in inches
  weight: string; // Weight in pounds per foot (ppf)
  grade: string; // Steel grade, e.g., 'L80'
  settingDepth: string; // Measured Depth of the packer or hanger in feet
  pbrDepth: string; // Measured Depth of the Polished Bore Receptacle, if present
}

/**
 * Key characteristics of the reservoir being targeted.
 */
export interface ReservoirData {
  pressure: string; // Reservoir pressure in psi
  temperature: string; // Reservoir temperature in degrees Fahrenheit
  fluids: string; // Type of fluids in the reservoir, e.g., 'Oil, Gas, Water'
  oowc: string; // Original Oil-Water Contact depth in feet TVD
}

/**
 * Represents a single valve on the christmas tree.
 */
export interface TreeValve {
  id: string;
  valve: string; // Valve name, e.g., 'UMV' (Upper Master Valve)
  type: string; // Valve type, e.g., 'Gate'
  status: 'Open' | 'Closed' | 'Checked';
}

/**
 * Represents a distinct fluid column within the wellbore.
 */
export interface FluidColumn {
  id: string;
  fluidType: string; // e.g., 'NaCl Brine', 'Crude Oil'
  density: number | string; // Fluid density in pounds per gallon (ppg)
  topDepth: number | string; // Top of the fluid column in feet MD
  bottomDepth: number | string; // Bottom of the fluid column in feet MD
}

/**
 * Describes the current state of the well before the intervention.
 */
export interface WellStatus {
  suspensionDetails: string; // A summary of why the well is in its current state
  treeValves: TreeValve[];
  sihwp: string; // Shut-In Wellhead Pressure in psi
  fluidLevels: FluidColumn[]; // An array describing the fluids currently in the well
}

/**
 * High-level goals of the well program.
 */
export interface Objectives {
  core: string; // The primary, single-sentence objective
  goals: string[]; // A list of secondary, supporting goals
}

/**
 * A major phase of the operational program.
 */
export interface ProgramPhase {
  id: string;
  name: string;
  procedure?: string; // The detailed, step-by-step procedure for this phase
  status?: 'Locked' | 'Next' | 'Active' | 'Complete';
}

/**
 * A piece of equipment required for the operation.
 */
export interface Equipment {
  id: string;
  name: string;
  specification: string;
  quantity: number | string;
  certificationStatus: 'Certified' | 'Pending' | 'Expired';
  assignedVendor: string;
}

/**
 * A fluid or material (like cement) required for the operation.
 */
export interface FluidMaterial {
  id: string;
  name: string;
  volume: string; // Required volume, e.g., '500 bbls'
  purpose: string;
  permitStatus: 'Approved' | 'Pending' | 'Not Required';
}

/**
 * Key personnel involved in the operation.
 */
export interface Personnel {
  id: string;
  role: string;
  name: string;
  contactInfo: string;
}

/**
 * A record for the Management of Change process.
 */
export interface MOCRecord {
  id:string;
  mocId: string; // User-defined MOC identifier, e.g., 'MOC-WT75X-001'
  dateRequested: string; // YYYY-MM-DD
  description: string;
  justification: string;
  approvals: string; // List of approvers
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Closed';
}

/**
 * Encapsulates all risk-related information for the program.
 */
export interface Risk {
  hazards: string; // A summary of known hazards and mitigation plans
  moc: MOCRecord[]; // A log of all Management of Change records
  permits: string; // Status of required operational permits
}

/**
 * A line item in the Authorization for Expenditure (AFE).
 */
export interface AFEItem {
  id: string;
  lineItemCode: string;
  description: string;
  vendor: string;
  estimatedCost: number;
  accruedCost: number;
  actualCost: number;
}

/**
 * A significant event that occurred during operations.
 */
export interface OperationalEvent {
  id: string;
  timestamp: string; // HH:MM
  category: 'Milestone' | 'NPT' | 'Safety' | 'Observation' | 'Equipment Failure';
  description: string;
  impact: string; // The effect of the event on the operation
}

/**
 * A summary of one day of operations.
 */
export interface DailyReport {
  id: string;
  day: number;
  summary: string;
  events: OperationalEvent[];
}

/**
 * A single data point from a live operational feed.
 */
export interface LiveOperationDataPoint {
  id: string;
  timestamp: string; // HH:MM
  plannedHookload: number; // in k-lbs
  actualHookload: number; // in k-lbs
  plannedAnnulusPressure: number; // in psi
  actualAnnulusPressure: number; // in psi
}

/**
 * Represents a single row from a detailed job execution log (CSV).
 */
export interface JobLogEntry {
    timestamp: string;
    timeMinutes: number;
    depth: number;
    whp: number;
    hookload: number;
    flowRate: number;
    temp: number;
    rpm: number;
    torque: number;
    status: string;
    alerts: string;
}

/**
 * A record of Non-Productive Time (NPT).
 */
export interface NPTItem {
    id: string;
    date: string; // YYYY-MM-DD
    duration: number; // in hours
    category: string;
    rootCause: string;
    vendor: string;
    costImpact: number; // in USD
}

/**
 * A performance scorecard for a vendor.
 */
export interface VendorScorecard {
    id: string;
    vendor: string;
    serviceLine: string;
    overallRating: number; // e.g., 1-5
    onTimeDelivery: number;
    equipmentQuality: number;
    technicalSupport: number;
    costCompetitiveness: number;
    safetyRecord: number;
}

/**
 * Data collected during the project closeout phase.
 */
export interface Closeout {
  performanceSummary: string;
  nptBreakdown: NPTItem[];
  vendorScorecards: VendorScorecard[];
  lessonsLearned: string;
}

/**
 * An item in the completion tally (the string of pipes and tools run in the well).
 */
export interface CompletionTallyItem {
  id: string;
  isHeader?: boolean; // True if this is a title row, not an actual item
  item: string | number;
  description: string;
  od: string | number; // Outer Diameter in inches
  id_in: string | number; // Inner Diameter in inches
  length: string | number; // Length in feet
  topDepth: string | number; // Top of item in feet MD
  bottomDepth: string | number; // Bottom of item in feet MD
}

/**
 * An item in the plugging tally for well abandonment.
 */
export interface PluggingTallyItem {
    id: string;
    plugNumber: string | number;
    description: string;
    plugType: string; // e.g., 'Cement', 'Bridge Plug'
    topOfPlug: string | number; // in feet MD
    bottomOfPlug: string | number; // in feet MD
    notes: string;
}

/**
 * A key observation or finding, often tied to a specific depth.
 */
export interface KeyObservation {
  id: string;
  depth: number | string; // in feet MD
  type: 'Discrepancy' | 'Hazard' | 'Note'; // Discrepancy from plan, potential hazard, or general note
  description: string;
}

/**
 * A single station in a deviation survey, defining the well's path.
 */
export interface DeviationSurveyStation {
  id: string;
  md: number; // Measured Depth in feet
  incl: number; // Inclination from vertical in degrees
  azim: number; // Azimuth (compass direction) in degrees
}

/**
 * A unified interface for any item that can be displayed on the wellbore schematic.
 * This includes casing strings, completion components, plugs, and key observations.
 */
export interface SchematicItem {
  id: string;
  type: 'Casing' | 'Completion' | 'Plug' | 'Observation';
  top: string | number;
  bottom: string | number;
  description: string;
  // Allow for other properties from the source objects, like 'size' for casing.
  [key: string]: any;
}

/**
 * Represents a formal approval or sign-off on the program document.
 */
export interface Approval {
  id: string;
  role: string;
  name: string;
  signature: string;
  date: string;
}

/**
 * The root interface for the entire well program.
 * This structure contains all data related to a single well intervention plan.
 */
export interface WellProgram {
  id: string;
  wellHeader: WellHeader;
  issueRevisionLog: Revision[];
  wellTrajectory: WellTrajectory;
  deviationSurvey: DeviationSurveyStation[];
  casingSchema: CasingSchema[];
  tubingSchema: TubingSchema;
  reservoirData: ReservoirData;
  wellStatus: WellStatus;
  objectives: Objectives;
  phases: ProgramPhase[];
  equipment: Equipment[];
  fluids: FluidMaterial[];
  personnel: Personnel[];
  risk: Risk;
  afe: AFEItem[];
  dailyReports: DailyReport[];
  liveOperationsData: LiveOperationDataPoint[];
  jobLog: JobLogEntry[]; // High-resolution job execution log (from CSV)
  keyObservations: KeyObservation[];
  schematicDescription: string;
  completionTally: CompletionTallyItem[];
  pluggingTally: PluggingTallyItem[];
  closeout: Closeout;
  uploadedFiles: UploadedFile[];
  approvals: Approval[];
}
