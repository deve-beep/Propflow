import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';

const Building = () => {
  const group = useRef();
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
    }
  });

  return (
    <group ref={group}>
      {/* Main tower */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 3, 1.2]} />
        <meshStandardMaterial color="#e7e6e3" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Secondary tower */}
      <mesh position={[1.6, -0.6, -0.5]}>
        <boxGeometry args={[0.9, 1.8, 0.9]} />
        <meshStandardMaterial color="#d3cabb" roughness={0.5} />
      </mesh>
      {/* Base plinth */}
      <mesh position={[0.4, -1.7, 0]}>
        <boxGeometry args={[3.2, 0.3, 2.4]} />
        <meshStandardMaterial color="#c06a44" roughness={0.6} />
      </mesh>

      {/* Floating info chip */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.8}>
        <mesh position={[-1.6, 0.8, 1]}>
          <boxGeometry args={[0.5, 0.5, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
};

export const HeroScene = () => (
  <div className="absolute inset-0 opacity-90">
    <Canvas camera={{ position: [4, 2, 5], fov: 40 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <Building />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  </div>
);
