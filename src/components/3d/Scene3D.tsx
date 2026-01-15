import { Canvas } from '@react-three/fiber';
import { useLineStore } from '@/store/useLineStore';
import { Machine3D } from './Machine3D';
import { Ground } from './Ground';
import { CameraController } from './CameraController';
import { SceneLighting } from './SceneLighting';

/**
 * Main 3D scene container for the sewing line visualization
 */
export const Scene3D = () => {
  const { machineLayout, selectedMachine } = useLineStore();
  
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [5, 8, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0f172a');
        }}
      >
        {/* Fog for depth effect */}
        <fog attach="fog" args={['#0f172a', 15, 60]} />
        
        {/* Lighting setup */}
        <SceneLighting />
        
        {/* Ground plane with grid */}
        <Ground />
        
        {/* Machines */}
        {machineLayout.map((machine) => (
          <Machine3D key={machine.id} machineData={machine} />
        ))}
        
        {/* Camera controls */}
        <CameraController 
          machineLayout={machineLayout} 
          selectedMachine={selectedMachine} 
        />
      </Canvas>
    </div>
  );
};
