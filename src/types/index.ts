// Core types for the 3D Line Planner Application

/**
 * Normalized operation data structure
 * This is what we convert raw Excel data into
 */
export interface Operation {
  op_no: string;
  op_name: string;
  machine_type: string;
  smv: number;
  section: string;
}

/**
 * Machine position in 3D space
 */
export interface MachinePosition {
  id: string;
  operation: Operation;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * Complete line data structure
 */
export interface LineData {
  id: string;
  lineNo: string;
  styleNo: string;
  createdAt: string;
  updatedAt: string;
  operations: Operation[];
  machineLayout: MachinePosition[];
  totalSMV: number;
}

/**
 * Machine type categories for 3D models and colors
 */
export type MachineCategory = 
  | 'snls'      // Single Needle Lock Stitch
  | 'snec'      // Overlock/Edge cutting
  | 'iron'      // Iron/Pressing
  | 'button'    // Button hole/sewing
  | 'bartack'   // Bartack machine
  | 'special'   // Special machines
  | 'helper'    // Helper tables
  | 'default';  // Unknown/Other

/**
 * UI state for modals and panels
 */
export interface UIState {
  isMachineInfoOpen: boolean;
  isFileUploadOpen: boolean;
  isLoading: boolean;
  loadingMessage: string;
}

/**
 * Column mapping aliases for Excel parsing
 */
export interface ColumnAliases {
  op_no: string[];
  op_name: string[];
  machine_type: string[];
  smv: string[];
  section: string[];
}
