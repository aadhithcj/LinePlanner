import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { MachinePosition } from '@/types';
import { getMachineCategory } from '@/utils/obParser';
import { useLineStore } from '@/store/useLineStore';

interface Machine3DProps {
  machineData: MachinePosition;
}

/**
 * Color mapping for different machine types
 */
const MACHINE_COLORS: Record<string, string> = {
  snls: '#3b82f6',    // Blue - Single needle
  snec: '#a855f7',    // Purple - Overlock
  iron: '#f97316',    // Orange - Iron/Press
  button: '#ec4899',  // Pink - Button
  bartack: '#14b8a6', // Teal - Bartack
  helper: '#84cc16',  // Lime - Helper tables
  special: '#eab308', // Yellow - Special machines
  default: '#6b7280', // Gray - Unknown
};

/**
 * 3D Machine component with hover and click interactions
 */
export const Machine3D = ({ machineData }: Machine3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  const { selectedMachine, setSelectedMachine } = useLineStore();
  const isSelected = selectedMachine?.id === machineData.id;
  
  const machineCategory = getMachineCategory(machineData.operation.machine_type);
  const baseColor = MACHINE_COLORS[machineCategory] || MACHINE_COLORS.default;
  
  // Animate hover and selection states
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Target Y position based on hover/selection
    const targetY = hovered || isSelected ? 0.15 : 0;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      machineData.position.y + targetY,
      delta * 8
    );
    
    // Scale animation on click
    const targetScale = clicked ? 0.95 : hovered || isSelected ? 1.05 : 1;
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta * 10);
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, delta * 10);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, delta * 10);
  });

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 150);
    setSelectedMachine(isSelected ? null : machineData);
  };

  return (
    <group
      position={[machineData.position.x, machineData.position.y, machineData.position.z]}
      rotation={[machineData.rotation.x, machineData.rotation.y, machineData.rotation.z]}
    >
      {/* Machine body */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        castShadow
        receiveShadow
      >
        <RoundedBox args={[1.2, 0.8, 0.8]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color={baseColor}
            metalness={0.3}
            roughness={0.4}
            emissive={isSelected || hovered ? baseColor : '#000000'}
            emissiveIntensity={isSelected ? 0.4 : hovered ? 0.2 : 0}
          />
        </RoundedBox>
      </mesh>
      
      {/* Machine table surface */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.4, 0.05, 1]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#94a3b8' : '#64748b'}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      
      {/* Selection indicator ring */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.9, 32]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.6} />
        </mesh>
      )}
      
      {/* Operation number label */}
      <Text
        position={[0, 0.55, 0.6]}
        fontSize={0.15}
        color={hovered || isSelected ? '#ffffff' : '#94a3b8'}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff"
      >
        {machineData.operation.op_no}
      </Text>
      
      {/* Machine type label (visible on hover) */}
      {(hovered || isSelected) && (
        <Text
          position={[0, 0.75, 0]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {machineData.operation.machine_type}
        </Text>
      )}
    </group>
  );
};
