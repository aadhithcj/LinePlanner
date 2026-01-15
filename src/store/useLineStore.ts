import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LineData, MachinePosition, Operation, UIState } from '@/types';

interface LineStoreState {
  // Line metadata
  currentLine: LineData | null;
  savedLines: LineData[];
  
  // Parsed operations from Excel
  operations: Operation[];
  
  // Generated machine layout
  machineLayout: MachinePosition[];
  
  // Selected machine in 3D view
  selectedMachine: MachinePosition | null;
  
  // UI state
  ui: UIState;
  
  // Actions
  setCurrentLine: (line: LineData | null) => void;
  setOperations: (ops: Operation[]) => void;
  setMachineLayout: (layout: MachinePosition[]) => void;
  setSelectedMachine: (machine: MachinePosition | null) => void;
  
  // Line management
  createLine: (lineNo: string, styleNo: string, operations: Operation[]) => LineData;
  saveLine: (line: LineData) => void;
  deleteLine: (id: string) => void;
  loadLine: (id: string) => void;
  
  // UI actions
  setUIState: (state: Partial<UIState>) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  
  // Layout generation
  generateMachineLayout: (operations: Operation[]) => MachinePosition[];
}

/**
 * Machine spacing configuration
 */
const MACHINE_SPACING = 2.5; // Units between machines
const ROW_OFFSET = 3; // Offset for alternating rows

/**
 * Generate unique ID for lines
 */
const generateId = () => `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Main Zustand store for the Line Planner application
 */
export const useLineStore = create<LineStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLine: null,
      savedLines: [],
      operations: [],
      machineLayout: [],
      selectedMachine: null,
      ui: {
        isMachineInfoOpen: false,
        isFileUploadOpen: false,
        isLoading: false,
        loadingMessage: '',
      },

      // Setters
      setCurrentLine: (line) => set({ currentLine: line }),
      setOperations: (operations) => set({ operations }),
      setMachineLayout: (machineLayout) => set({ machineLayout }),
      setSelectedMachine: (machine) => 
        set((state) => ({ 
          selectedMachine: machine,
          ui: { ...state.ui, isMachineInfoOpen: machine !== null }
        })),

      // Generate 3D layout from operations
      generateMachineLayout: (operations) => {
        const layout: MachinePosition[] = [];
        
        operations.forEach((op, index) => {
          // Create a two-row layout for better visualization
          const row = index % 2;
          const col = Math.floor(index / 2);
          
          const position: MachinePosition = {
            id: `machine_${index}_${op.op_no}`,
            operation: op,
            position: {
              x: col * MACHINE_SPACING,
              y: 0,
              z: row * ROW_OFFSET - ROW_OFFSET / 2, // Center the rows
            },
            rotation: {
              x: 0,
              y: row === 1 ? Math.PI : 0, // Face each other
              z: 0,
            },
          };
          
          layout.push(position);
        });
        
        set({ machineLayout: layout });
        return layout;
      },

      // Create a new line
      createLine: (lineNo, styleNo, operations) => {
        const layout = get().generateMachineLayout(operations);
        const totalSMV = operations.reduce((sum, op) => sum + (op.smv || 0), 0);
        
        const line: LineData = {
          id: generateId(),
          lineNo,
          styleNo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          operations,
          machineLayout: layout,
          totalSMV,
        };
        
        set({ currentLine: line, operations, machineLayout: layout });
        return line;
      },

      // Save line to localStorage
      saveLine: (line) => {
        set((state) => {
          const existingIndex = state.savedLines.findIndex((l) => l.id === line.id);
          const updatedLine = { ...line, updatedAt: new Date().toISOString() };
          
          if (existingIndex >= 0) {
            const updatedLines = [...state.savedLines];
            updatedLines[existingIndex] = updatedLine;
            return { savedLines: updatedLines };
          }
          
          return { savedLines: [...state.savedLines, updatedLine] };
        });
      },

      // Delete a saved line
      deleteLine: (id) => {
        set((state) => ({
          savedLines: state.savedLines.filter((l) => l.id !== id),
          currentLine: state.currentLine?.id === id ? null : state.currentLine,
        }));
      },

      // Load a saved line
      loadLine: (id) => {
        const { savedLines } = get();
        const line = savedLines.find((l) => l.id === id);
        
        if (line) {
          set({
            currentLine: line,
            operations: line.operations,
            machineLayout: line.machineLayout,
            selectedMachine: null,
          });
        }
      },

      // UI state management
      setUIState: (newState) => 
        set((state) => ({ ui: { ...state.ui, ...newState } })),
      
      setLoading: (isLoading, message = '') => 
        set((state) => ({ 
          ui: { ...state.ui, isLoading, loadingMessage: message } 
        })),
    }),
    {
      name: 'line-planner-storage',
      partialize: (state) => ({ 
        savedLines: state.savedLines 
      }),
    }
  )
);
