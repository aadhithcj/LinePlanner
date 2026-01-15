import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { MachinePosition } from '@/types';

interface CameraControllerProps {
  machineLayout: MachinePosition[];
  selectedMachine: MachinePosition | null;
}

/**
 * Camera controller with smooth transitions and orbit controls
 */
export const CameraController = ({ machineLayout, selectedMachine }: CameraControllerProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosition = useRef(new THREE.Vector3(5, 8, 10));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  // Calculate optimal camera position based on layout
  useEffect(() => {
    if (machineLayout.length === 0) return;
    
    // Calculate bounds
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    machineLayout.forEach((m) => {
      minX = Math.min(minX, m.position.x);
      maxX = Math.max(maxX, m.position.x);
      minZ = Math.min(minZ, m.position.z);
      maxZ = Math.max(maxZ, m.position.z);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const width = maxX - minX + 5;
    const depth = maxZ - minZ + 5;
    const maxDim = Math.max(width, depth);
    
    targetPosition.current.set(centerX + maxDim * 0.5, maxDim * 0.6, centerZ + maxDim * 0.8);
    targetLookAt.current.set(centerX, 0, centerZ);
    
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetLookAt.current);
    }
  }, [machineLayout]);
  
  // Smooth camera transition to selected machine
  useEffect(() => {
    if (selectedMachine) {
      const { x, z } = selectedMachine.position;
      targetLookAt.current.set(x, 0.5, z);
      targetPosition.current.set(x + 3, 4, z + 5);
    } else if (machineLayout.length > 0) {
      // Reset to overview
      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      
      machineLayout.forEach((m) => {
        minX = Math.min(minX, m.position.x);
        maxX = Math.max(maxX, m.position.x);
        minZ = Math.min(minZ, m.position.z);
        maxZ = Math.max(maxZ, m.position.z);
      });
      
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const maxDim = Math.max(maxX - minX, maxZ - minZ) + 5;
      
      targetPosition.current.set(centerX + maxDim * 0.5, maxDim * 0.6, centerZ + maxDim * 0.8);
      targetLookAt.current.set(centerX, 0, centerZ);
    }
  }, [selectedMachine, machineLayout]);
  
  // Smooth camera animation
  useFrame((state, delta) => {
    camera.position.lerp(targetPosition.current, delta * 2);
    
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, delta * 2);
      controlsRef.current.update();
    }
  });
  
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2.2}
      minDistance={3}
      maxDistance={50}
    />
  );
};
