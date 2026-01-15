import * as XLSX from 'xlsx';
import type { Operation, ColumnAliases } from '@/types';

/**
 * Column name aliases for flexible parsing
 * The parser will try to match any of these variations
 */
const COLUMN_ALIASES: ColumnAliases = {
  op_no: ['op_no', 'operation_no', 'op no', 'operation no', 'opno', 'sl #', 'sl#', 'sl no', 'sno', 's.no', 's no', 'sr', 'sr.', 'sr no', 'serial'],
  op_name: ['op_name', 'operation_name', 'op name', 'operation name', 'opname', 'description', 'operation description', 'op desc', 'operation', 'process'],
  machine_type: ['machine_type', 'machine type', 'machinetype', 'machine', 'mc type', 'mc', 'm/c', 'm/c type', 'equipment'],
  smv: ['smv', 'sam', 'standard_minute', 'time', 'std min', 'standard minute', 'standard time', 'cycle time'],
  section: ['section', 'sect', 'department', 'dept', 'area', 'zone'],
};

/**
 * Normalize a string for comparison
 * Removes spaces, underscores, and converts to lowercase
 */
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .replace(/[\s_\-\.\/]/g, '')
    .trim();
};

/**
 * Find the column index for a given field using aliases
 */
const findColumnIndex = (headers: string[], field: keyof ColumnAliases): number => {
  const aliases = COLUMN_ALIASES[field].map(normalizeString);
  
  for (let i = 0; i < headers.length; i++) {
    const normalizedHeader = normalizeString(headers[i]);
    if (aliases.some(alias => normalizedHeader.includes(alias) || alias.includes(normalizedHeader))) {
      return i;
    }
  }
  
  return -1;
};

/**
 * Detect if a row is a header row by checking for known column names
 */
const isHeaderRow = (row: (string | number)[]): boolean => {
  const allAliases = Object.values(COLUMN_ALIASES).flat().map(normalizeString);
  let matchCount = 0;
  
  for (const cell of row) {
    const normalized = normalizeString(String(cell || ''));
    if (allAliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
      matchCount++;
    }
    // Need at least 2 matches to consider it a header
    if (matchCount >= 2) return true;
  }
  
  return false;
};

/**
 * Check if a row is a section header (like "Collar", "Front", etc.)
 */
const isSectionHeader = (row: (string | number)[]): string | null => {
  // If the first cell has text but subsequent cells are empty
  const firstCell = String(row[0] || '').trim();
  const secondCell = String(row[1] || '').trim();
  
  if (firstCell && !secondCell && isNaN(Number(firstCell))) {
    // It's likely a section header if it doesn't start with a number
    // and has no operation details
    const emptyCount = row.filter(cell => !cell || String(cell).trim() === '').length;
    if (emptyCount >= row.length - 2) {
      return firstCell;
    }
  }
  
  return null;
};

/**
 * Check if a row is a valid operation row
 */
const isOperationRow = (row: (string | number)[], opNoIndex: number, machineIndex: number): boolean => {
  // Must have an operation number (can be numeric or string)
  const opNo = row[opNoIndex];
  if (!opNo && opNo !== 0) return false;
  
  // Skip if it looks like a subtotal or total row
  const firstCell = String(row[0] || '').toLowerCase();
  if (firstCell.includes('total') || firstCell.includes('sub total') || firstCell.includes('subtotal')) {
    return false;
  }
  
  // Should have a machine type
  const machine = row[machineIndex];
  if (!machine || String(machine).trim() === '') return false;
  
  return true;
};

/**
 * Parse an Excel file and extract operations
 */
export const parseOBExcel = async (file: File): Promise<Operation[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays, handling merged cells
        const rawData: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });
        
        if (rawData.length === 0) {
          reject(new Error('Empty spreadsheet'));
          return;
        }
        
        // Find the header row
        let headerRowIndex = -1;
        let headers: string[] = [];
        
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
          const row = rawData[i];
          if (isHeaderRow(row)) {
            headerRowIndex = i;
            headers = row.map(cell => String(cell || ''));
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          reject(new Error('Could not find header row. Please ensure the Excel file has column headers.'));
          return;
        }
        
        // Find column indices
        const opNoIndex = findColumnIndex(headers, 'op_no');
        const opNameIndex = findColumnIndex(headers, 'op_name');
        const machineIndex = findColumnIndex(headers, 'machine_type');
        const smvIndex = findColumnIndex(headers, 'smv');
        const sectionIndex = findColumnIndex(headers, 'section');
        
        if (opNoIndex === -1) {
          reject(new Error('Could not find operation number column'));
          return;
        }
        
        if (machineIndex === -1) {
          reject(new Error('Could not find machine type column'));
          return;
        }
        
        // Parse operations
        const operations: Operation[] = [];
        let currentSection = 'General';
        
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          
          // Check for section header
          const sectionHeader = isSectionHeader(row);
          if (sectionHeader) {
            currentSection = sectionHeader;
            continue;
          }
          
          // Check if it's a valid operation row
          if (!isOperationRow(row, opNoIndex, machineIndex)) {
            continue;
          }
          
          // Extract operation data
          const opNo = String(row[opNoIndex] || '').trim();
          const opName = opNameIndex >= 0 ? String(row[opNameIndex] || '').trim() : '';
          const machineType = String(row[machineIndex] || '').trim();
          
          // Parse SMV - handle various formats
          let smv = 0;
          if (smvIndex >= 0) {
            const smvValue = row[smvIndex];
            if (typeof smvValue === 'number') {
              smv = smvValue;
            } else if (typeof smvValue === 'string') {
              const parsed = parseFloat(smvValue.replace(/[^\d.]/g, ''));
              if (!isNaN(parsed)) {
                smv = parsed;
              }
            }
          }
          
          const section = sectionIndex >= 0 ? String(row[sectionIndex] || currentSection).trim() : currentSection;
          
          operations.push({
            op_no: opNo,
            op_name: opName,
            machine_type: machineType,
            smv,
            section,
          });
        }
        
        if (operations.length === 0) {
          reject(new Error('No valid operations found in the Excel file'));
          return;
        }
        
        resolve(operations);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Get machine category for 3D model selection and coloring
 */
export const getMachineCategory = (machineType: string): string => {
  const normalized = normalizeString(machineType);
  
  if (normalized.includes('snls') || normalized.includes('singleneedle') || normalized.includes('lockstitch')) {
    return 'snls';
  }
  if (normalized.includes('snec') || normalized.includes('overlock') || normalized.includes('edge')) {
    return 'snec';
  }
  if (normalized.includes('iron') || normalized.includes('press') || normalized.includes('fusing')) {
    return 'iron';
  }
  if (normalized.includes('button') || normalized.includes('bhole') || normalized.includes('buttonhole')) {
    return 'button';
  }
  if (normalized.includes('bartack') || normalized.includes('bar tack')) {
    return 'bartack';
  }
  if (normalized.includes('helper') || normalized.includes('table')) {
    return 'helper';
  }
  if (normalized.includes('special') || normalized.includes('contour') || normalized.includes('turning') || 
      normalized.includes('pointing') || normalized.includes('notch') || normalized.includes('wrapping')) {
    return 'special';
  }
  
  return 'default';
};
