import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox, Float, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Code2, Database, RefreshCw, Zap } from 'lucide-react';

function FloatingNodeCard({ position, title, subtitle, color, fields, iconType }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
    }
  });

  return (
    <group position={position} ref={meshRef}>
      {/* 3D Card Background Box */}
      <RoundedBox args={[3.2, 4.2, 0.2]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
      </RoundedBox>

      {/* Header Text */}
      <Text position={[0, 1.6, 0.12]} fontSize={0.24} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
        {title}
      </Text>
      
      <Text position={[0, 1.25, 0.12]} fontSize={0.15} color="#cbd5e1" anchorX="center" anchorY="middle">
        {subtitle}
      </Text>

      {/* Divider */}
      <mesh position={[0, 0.95, 0.12]}>
        <planeGeometry args={[2.8, 0.02]} />
        <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>

      {/* Fields List in 3D */}
      {fields.map((f, i) => (
        <group key={f.name || i} position={[0, 0.5 - i * 0.55, 0.12]}>
          <mesh position={[-1.2, 0, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <Text position={[-1.0, 0, 0]} fontSize={0.16} color="#ffffff" anchorX="left" anchorY="middle">
            {f.name}
          </Text>
          <Text position={[1.2, 0, 0]} fontSize={0.13} color="#94a3b8" anchorX="right" anchorY="middle">
            {f.type || f.dataType}
          </Text>
        </group>
      ))}
    </group>
  );
}

function BezierConnection({ start, end, color = "#6366f1" }) {
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3(start[0] + 1.5, start[1], start[2]),
    new THREE.Vector3(end[0] - 1.5, end[1], end[2]),
    new THREE.Vector3(...end)
  );

  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} linewidth={3} />
    </line>
  );
}

export default function VisualNodeCanvas3D({ parsedForm, setViewMode }) {
  const { formId, collectionName, fields } = parsedForm;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Interactive 3D Spatial Canvas</h2>
            <span className="text-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              Three.js WebGL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rotate, pan, and zoom in 3D space to explore the visual architecture nodes.
          </p>
        </div>

        <button
          onClick={() => setViewMode('2d')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all"
        >
          <Code2 className="h-4 w-4" />
          <span>Switch to 2D Schematic</span>
        </button>
      </div>

      {/* 3D WebGL Canvas Window */}
      <div className="h-[550px] w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
        
        {/* Orbit Helper Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Click & Drag to Orbit 3D Scene</span>
        </div>

        <Canvas camera={{ position: [0, 1, 8], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} color="#818cf8" intensity={1} />

          {/* Spatial Grid Floor */}
          <Grid
            args={[30, 30]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#334155"
            sectionSize={2.5}
            sectionThickness={1}
            sectionColor="#6366f1"
            fadeDistance={25}
            fadeStrength={1.5}
            position={[0, -2.5, 0]}
          />

          {/* Node 1: HTML Form */}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
            <FloatingNodeCard
              position={[-4, 0.5, 0]}
              title="HTML FORM"
              subtitle={`#${formId}`}
              color="#312e81"
              fields={fields}
            />
          </Float>

          {/* Node 2: Express API */}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
            <FloatingNodeCard
              position={[0, 0.5, 0]}
              title="EXPRESS API"
              subtitle={`POST /api/${collectionName}`}
              color="#4c1d95"
              fields={fields.map(f => ({ name: f.name, type: 'Param' }))}
            />
          </Float>

          {/* Node 3: MongoDB */}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
            <FloatingNodeCard
              position={[4, 0.5, 0]}
              title="MONGODB DB"
              subtitle={`db.${collectionName}`}
              color="#064e3b"
              fields={fields.map(f => ({ name: f.name, type: f.dataType }))}
            />
          </Float>

          {/* 3D Bezier Connection Lines */}
          <BezierConnection start={[-2.4, 0.5, 0]} end={[-1.6, 0.5, 0]} color="#818cf8" />
          <BezierConnection start={[1.6, 0.5, 0]} end={[2.4, 0.5, 0]} color="#34d399" />

          <OrbitControls makeDefault enableZoom={true} maxPolarAngle={Math.PI / 2 + 0.1} />
        </Canvas>

      </div>

    </div>
  );
}
