
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { MachinePosition } from '@/types';
import { useLineStore } from '@/store/useLineStore';

interface Machine3DProps {
  machineData: MachinePosition;
}

// Maps machine keys (lowercase) to GLB filenames
const MODEL_MAP: Record<string, string> = {
  // Sewing Family
  snls: 'last machine.glb',
  dnls: 'last machine.glb',
  snec: '3t ol.glb', // Overlock
  '3t ol': '3t ol.glb',

  // Specifics
  bartack: 'bartack.finalglb.glb',
  iron: 'iron press.glb',
  inspection: 'inspection machine final.glb',

  // Button
  button: 'buttonmaking mc.glb',
  buttonhole: 'buttonhole.glb',

  // Helpers
  supermarket: 'supermarket.glb',
  trolley: 'helpers table.glb',
  helper: 'helpers table.glb',
  fusing: 'fusing mc.glb',
  turning: 'turning mc.glb',
  contour: 'contour machine.glb',
  blocking: 'blocking mc.glb',

  // Default override
  default: 'last machine.glb'
};

const getModelUrl = (type: string) => {
  if (!type) return `/models/${MODEL_MAP['default']}`;
  const t = type.toLowerCase();
  for (const key of Object.keys(MODEL_MAP)) {
    if (t.includes(key)) {
      return `/models/${MODEL_MAP[key]}`;
    }
  }
  return `/models/${MODEL_MAP['default']}`;
};

export const Machine3D = ({ machineData }: Machine3DProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const { selectedMachine, setSelectedMachine, visibleSection } = useLineStore();
  const isSelected = selectedMachine?.id === machineData.id;

  // Visibility Logic
  const isVisible = !visibleSection || (machineData.section && machineData.section.toLowerCase() === visibleSection.toLowerCase());

  // Check if this is a Section Board
  if (machineData.operation.machine_type.toLowerCase().startsWith('board')) {
    if (!isVisible) return null;
    return (
      <group
        position={[machineData.position.x, machineData.position.y, machineData.position.z]}
        rotation={[machineData.rotation.x, machineData.rotation.y, machineData.rotation.z]}
      >
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <Text
          position={[0, 0, 0.06]}
          fontSize={0.2}
          color="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {machineData.section}
        </Text>
      </group>
    );
  }

  const modelUrl = getModelUrl(machineData.operation.machine_type);

  // Load model with error handling
  const { scene } = useGLTF(modelUrl, true); // true for draco (optional) or just useGLTF(url)
  // Clone scene
  const clonedScene = scene.clone();

  // Dynamic Scaling
  // Many industrial models are in MM or CM. ThreeJS is Meters.
  // If the model is huge, let's scale it down. 
  // A safe bet for these specific models (often raw exports) is 0.01 or 0.1.
  // User screenshot showed massive gray walls -> implies scale is like 100x or 1000x too big.
  // Let's try 0.1 first. If it's usually 1 unit = 1mm, then 0.001 is needed.
  // But let's start with 0.1 and we can adjust.
  // UPDATE: User says "set some other machine as default".
  // Note: We use 'last machine.glb' as default.

  const SCALE_FACTOR = 0.01; // Drastic reduction for mm -> m conversion 

  // Color override for selection/hover? 
  // With GLBs, it's harder to tint the whole model without traversing materials.
  // We will simply use an outline or indicator for selection.

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Scale animation
    const clickScale = clicked ? 0.9 : 1;
    // Apply Base Scale * Click Scale
    const finalScale = SCALE_FACTOR * clickScale;

    meshRef.current.scale.set(finalScale, finalScale, finalScale);

    // Hover effect
    const hoverY = hovered ? 0.1 : 0;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      machineData.position.y + hoverY,
      delta * 5
    );
  });

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 150);
    setSelectedMachine(isSelected ? null : machineData);
  };

  if (!isVisible) return null;

  return (
    <group
      ref={meshRef}
      position={[machineData.position.x, machineData.position.y, machineData.position.z]}
      rotation={[machineData.rotation.x, machineData.rotation.y, machineData.rotation.z]}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 3D Model */}
      <primitive object={clonedScene} castShadow receiveShadow />

      {/* Selection Highlight Ring */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#00ff00" toneMapped={false} />
        </mesh>
      )}

      {/* Info Label (Visible on Hover/Select) */}
      {(hovered || isSelected) && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap backdrop-blur-sm">
            <p className="font-bold">{machineData.operation.op_no}</p>
            <p>{machineData.operation.machine_type}</p>
          </div>
        </Html>
      )}
    </group>
  );
};
