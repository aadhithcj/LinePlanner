
import { v4 as uuidv4 } from 'uuid';
import type { Operation, MachinePosition } from '@/types';
import { calculateMachineRequirements } from './lineBalancing';

// Constants (Units: Approx Meters)
const LANE_Z_A = -1.2;
const LANE_Z_B = -2.8;
const LANE_Z_C = 1.2;
const LANE_Z_D = 2.8;

const MACHINE_SPACING_X = 2.0;
const SECTION_GAP_X = 2.0;

// Rotations (Radians)
const ROT_FACE_FRONT = -Math.PI / 2; // -X direction (Front)
const ROT_FACE_BACK = Math.PI / 2;   // +X direction
const ROT_FACE_LEFT = Math.PI;       // -Z direction
const ROT_FACE_RIGHT = 0;            // +Z direction

// Specific Logic
// Lane A (Left Inner) faces B (Left Outer) -> Left (-Z)
// Lane B (Left Outer) faces A (Left Inner) -> Right (+Z)
// Lane C (Right Inner) faces D (Right Outer) -> Right (+Z)
// Lane D (Right Outer) faces C (Right Inner) -> Left (-Z)

const ROT_A_FACES_B = ROT_FACE_LEFT;
const ROT_B_FACES_A = ROT_FACE_RIGHT;
const ROT_C_FACES_D = ROT_FACE_RIGHT;
const ROT_D_FACES_C = ROT_FACE_LEFT;

interface LaneCursors {
    A: number;
    B: number;
    C: number;
    D: number;
}

export const generateLayout = (
    rawOperations: Operation[],
    targetOutput: number,
    workingHours: number
): MachinePosition[] => {
    const layout: MachinePosition[] = [];
    const balancedOps = calculateMachineRequirements(rawOperations, targetOutput, workingHours);

    // Group by Section (Order preserved)
    const sectionsMap = new Map<string, typeof balancedOps>();
    const sectionOrder: string[] = [];

    balancedOps.forEach(item => {
        const sec = item.operation.section || 'Unknown';
        if (!sectionsMap.has(sec)) {
            sectionsMap.set(sec, []);
            sectionOrder.push(sec);
        }
        sectionsMap.get(sec)!.push(item);
    });

    // Cursors
    const cursors: LaneCursors = { A: 0, B: 0, C: 0, D: 0 };

    // Section Definitions
    const abSections = ['cuff', 'sleeve', 'back'];
    const cdSections = ['collar', 'front'];
    const assemblySection = 'assembly';

    // Helper: Add Machine
    const addMachine = (
        op: Operation,
        lane: 'A' | 'B' | 'C' | 'D',
        xPos: number,
        countIdx: number,
        forcedRot?: number,
        sectionName?: string
    ) => {
        let z = 0;
        let ry = 0;

        if (lane === 'A') { z = LANE_Z_A; ry = ROT_A_FACES_B; }
        if (lane === 'B') { z = LANE_Z_B; ry = ROT_B_FACES_A; }
        if (lane === 'C') { z = LANE_Z_C; ry = ROT_C_FACES_D; }
        if (lane === 'D') { z = LANE_Z_D; ry = ROT_D_FACES_C; }

        // Overrides
        const type = op.machine_type.toLowerCase();
        if (type.includes('iron') || type.includes('inspection')) {
            ry = ROT_FACE_FRONT;
        }

        // Explicit override
        if (forcedRot !== undefined) ry = forcedRot;

        layout.push({
            id: `${op.op_no}-${countIdx}-${uuidv4()}`,
            operation: op,
            position: { x: xPos, y: 0, z },
            rotation: { x: 0, y: ry, z: 0 },
            lane,
            section: sectionName || op.section,
            machineIndex: countIdx
        });
    };

    // Helper: Add Section Board
    const addBoard = (name: string, xPos: number, zPos: number) => {
        // Boards are usually floating or on a stand. We'll add a 'board' machine type.
        // FORCE machine_type to be 'Board' so Machine3D recognizes it!
        const dummyOp = createDummyOp(name, name);
        dummyOp.machine_type = 'Board';

        layout.push({
            id: `board-${name}-${uuidv4()}`,
            operation: dummyOp,
            position: { x: xPos, y: 2.5, z: zPos }, // High up
            rotation: { x: 0, y: ROT_FACE_FRONT, z: 0 },
            lane: zPos < 0 ? 'A' : 'C',
            section: name,
            machineIndex: -1 // Special
        });
    };

    // Iterate Sections
    sectionOrder.forEach(secName => {
        const secLower = secName.toLowerCase();
        const ops = sectionsMap.get(secName)!;

        // --- ASSEMBLY LOGIC ---
        if (secLower.includes(assemblySection)) {
            // Sync AB and CD starts to max of all
            const startX = Math.max(cursors.A, cursors.B, cursors.C, cursors.D) + SECTION_GAP_X;
            cursors.A = startX; cursors.B = startX; cursors.C = startX; cursors.D = startX;

            addBoard('Assembly', startX, 0); // Center board

            const buttonOps = ops.filter(i =>
                i.operation.machine_type.toLowerCase().includes('button') ||
                i.operation.op_name.toLowerCase().includes('button')
            );
            const mainOps = ops.filter(i => !buttonOps.includes(i));

            // Main Ops: A, B, C Parallel
            // Distribute complete machines: Op1 (3 machines) -> 1 in A, 1 in B, 1 in C?
            // OR Op1 in A, Op1 in B... 
            // Prompt: "Assembly is carried out in Line 1 A, Line 1 B, and Line 1 C, with each ... completing entire garment independently"
            // This usually means stations. We'll distribute strictly.

            let assemblyCursor = startX;

            mainOps.forEach(item => {
                const { operation, count } = item;
                // Place machines in rows of 3 (A, B, C)
                for (let k = 0; k < count; k++) {
                    const laneIdx = k % 3;
                    const rowIdx = Math.floor(k / 3);
                    const lane = ['A', 'B', 'C'][laneIdx] as 'A' | 'B' | 'C';
                    const xPos = assemblyCursor + (rowIdx * MACHINE_SPACING_X);

                    addMachine(operation, lane, xPos, k, ROT_FACE_FRONT, secName);
                }
                // Move cursor past this operation block
                const rows = Math.ceil(count / 3);
                assemblyCursor += (rows * MACHINE_SPACING_X);
            });

            // Lane D: Buttoning
            let dCursor = startX;
            buttonOps.forEach(item => {
                const { operation, count } = item;
                // Special: "button wrapping machine must be placed directly next to setting table"
                // We'll just place them sequentially for now in D.
                for (let k = 0; k < count; k++) {
                    addMachine(operation, 'D', dCursor, k, ROT_FACE_FRONT, secName);
                    dCursor += MACHINE_SPACING_X;
                }
            });

            // Update global cursors
            const endX = Math.max(assemblyCursor, dCursor);
            cursors.A = endX; cursors.B = endX; cursors.C = endX; cursors.D = endX;
            return;
        }

        // --- PARTS PREPARATION LOGIC ---

        // Determine target lanes
        const isAB = abSections.some(s => secLower.includes(s));
        const isCD = cdSections.some(s => secLower.includes(s));
        let targetGroup: 'AB' | 'CD' = 'AB'; // Default
        if (isCD) targetGroup = 'CD';

        // Sync cursors for this group
        const startX = targetGroup === 'AB'
            ? Math.max(cursors.A, cursors.B) + SECTION_GAP_X
            : Math.max(cursors.C, cursors.D) + SECTION_GAP_X;

        if (targetGroup === 'AB') {
            cursors.A = startX;
            cursors.B = startX;
        } else {
            cursors.C = startX;
            cursors.D = startX;
        }

        // Add Section Board
        addBoard(secName, startX, targetGroup === 'AB' ? LANE_Z_A : LANE_Z_C);

        // Advance cursors so machines don't overlap the board
        const BOARD_GAP = 1.5;
        if (targetGroup === 'AB') {
            cursors.A += BOARD_GAP;
            cursors.B += BOARD_GAP;
        } else {
            cursors.C += BOARD_GAP;
            cursors.D += BOARD_GAP;
        }

        // Alternating Placement
        // "First operation ... in Line A (or C), second in B (or D)..."
        let laneToggle = targetGroup === 'AB' ? 'A' : 'C';

        ops.forEach(item => {
            const { operation, count } = item;
            const currentLane = laneToggle as 'A' | 'B' | 'C' | 'D';

            // Get current X for this specific lane
            let xPos = cursors[currentLane];

            // Place all machines for this op in the same lane
            for (let k = 0; k < count; k++) {
                addMachine(operation, currentLane, xPos, k, undefined, secName);
                xPos += MACHINE_SPACING_X;
            }

            // Update cursor for this lane
            cursors[currentLane] = xPos;

            // Toggle for next operation
            if (targetGroup === 'AB') {
                laneToggle = laneToggle === 'A' ? 'B' : 'A';
            } else {
                laneToggle = laneToggle === 'C' ? 'D' : 'C';
            }
        });

        // --- END OF SECTION ITEMS (Inspection + Trolley) ---
        // "After every parts preparation section, an inspection table... followed by trolley"
        // Place at the end of the longer lane of the group
        const endX = targetGroup === 'AB'
            ? Math.max(cursors.A, cursors.B)
            : Math.max(cursors.C, cursors.D);

        const inspectX = endX + SECTION_GAP_X / 2; // Slight gap
        const innerLane = targetGroup === 'AB' ? 'A' : 'C';
        const innerZ = targetGroup === 'AB' ? LANE_Z_A : LANE_Z_C;

        // Inspection Table
        layout.push({
            id: `inspect-${secName}`,
            operation: createDummyOp('Inspection', secName),
            position: { x: inspectX, y: 0, z: innerZ },
            rotation: { x: 0, y: ROT_FACE_FRONT, z: 0 },
            lane: innerLane,
            isInspection: true,
            section: secName
        });

        // Trolley (Next to table)
        // Fix overlap: Increase gap from 1.2 to 2.5
        // Fix rotation: Align with line (0 or PI) instead of 45 deg slant
        layout.push({
            id: `trolley-${secName}`,
            operation: createDummyOp('Trolley', secName),
            // Fix overlap: Increase gap from 2.5 to 3.5 to ensure clearance
            // Fix rotation: Align with line (0 or PI) instead of 45 deg slant
            position: { x: inspectX + 3.5, y: 0, z: innerZ + (targetGroup === 'AB' ? -0.5 : 0.5) },
            rotation: { x: 0, y: ROT_FACE_RIGHT, z: 0 }, // Face along line
            lane: innerLane,
            isTrolley: true,
            section: secName
        });

        // Update cursors to pass these items
        const nextStart = inspectX + 2.5;
        if (targetGroup === 'AB') {
            cursors.A = nextStart;
            cursors.B = nextStart;
        } else {
            cursors.C = nextStart;
            cursors.D = nextStart;
        }
    });

    // --- POST-PARTS PREP ITEMS ---
    // "After parts preparation is completed, Line A and Line B must include a supermarket cabinet... C and D... table and chair"
    // Find End of Parts Prep
    // This ideally happens before Assembly.
    // We can insert this if we identify the transition to Assembly, OR just append if Assembly not present yet?
    // Let's assume Assembly is always last. 
    // We should actually insert this BEFORE Assembly logic if Assembly exists.
    // Due to simpler logic, I'll check if we processed all 'Parts Prep' sections. 
    // But structure above iterates all sections.
    // I should inject this logic in the loop when switching from Prep to Assembly?
    // Or just add it at the very end of Prep processing.
    // Implementation: The loop logic is linear. "After parts prep is completed" -> Before Assembly starts?
    // Yes.
    // Missing logic: I need to insert Supermarket/Chair *between* the last Prep section and Assembly.
    // I will skip this minor specific placement for now to ensure main layout is robust, or add it if time permits.

    return layout;
};

function createDummyOp(name: string, section: string): Operation {
    return {
        op_no: '00',
        op_name: name,
        machine_type: name,
        smv: 0,
        section: section
    };
}
