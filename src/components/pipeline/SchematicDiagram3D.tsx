import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Line, Sphere } from "@react-three/drei";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Maximize2, RotateCcw } from "lucide-react";
import * as THREE from "three";

interface SchematicDiagram3DProps {
  ligandName: string;
  ligandCid: string;
  smiles?: string;
  molecularFormula?: string;
  molecularWeight?: number;
  proteinName: string;
  pdbId: string;
  bindingAffinity: number;
  dockingScore: number;
}

const atomColors: Record<string, string> = {
  C: "#4a5568",
  O: "#ef4444",
  N: "#3b82f6",
  S: "#eab308",
  H: "#94a3b8",
  F: "#22c55e",
  Cl: "#16a34a",
  Br: "#ea580c",
  P: "#a855f7",
};

const atomRadii: Record<string, number> = {
  C: 0.4,
  O: 0.35,
  N: 0.35,
  S: 0.45,
  H: 0.2,
  F: 0.3,
  Cl: 0.4,
  Br: 0.45,
  P: 0.45,
};

// Generate 3D molecular structure from formula
const generate3DStructure = (formula: string, smiles: string) => {
  const atoms: { atom: string; position: [number, number, number] }[] = [];
  const bonds: { from: number; to: number; order: number }[] = [];
  
  const atomCounts: Record<string, number> = {};
  const atomMatches = formula?.match(/([A-Z][a-z]?)(\d*)/g) || [];
  
  atomMatches.forEach(match => {
    const [, atom, count] = match.match(/([A-Z][a-z]?)(\d*)/) || [];
    if (atom) {
      atomCounts[atom] = parseInt(count) || 1;
    }
  });

  // Create carbon backbone in 3D
  const carbonCount = Math.min(atomCounts['C'] || 6, 12);
  const ringRadius = 1.5;
  
  for (let i = 0; i < carbonCount; i++) {
    const angle = (i / carbonCount) * 2 * Math.PI;
    // Add slight z variation for 3D effect
    const zOffset = Math.sin(angle * 2) * 0.3;
    atoms.push({
      atom: 'C',
      position: [
        ringRadius * Math.cos(angle),
        ringRadius * Math.sin(angle),
        zOffset
      ]
    });
    
    // Add bonds between adjacent carbons
    if (i > 0) {
      bonds.push({ from: i - 1, to: i, order: i % 2 === 0 ? 2 : 1 });
    }
  }
  
  // Close the ring
  if (carbonCount > 2) {
    bonds.push({ from: carbonCount - 1, to: 0, order: 1 });
  }

  // Add heteroatoms branching from carbons
  const heteroatoms = ['O', 'N', 'S', 'F', 'Cl', 'Br', 'P'];
  let atomIndex = carbonCount;
  
  heteroatoms.forEach(hetero => {
    const count = Math.min(atomCounts[hetero] || 0, 3);
    for (let i = 0; i < count; i++) {
      const parentIndex = (atomIndex - carbonCount + i) % carbonCount;
      const parent = atoms[parentIndex];
      if (parent) {
        const outwardAngle = Math.atan2(parent.position[1], parent.position[0]);
        const zAngle = (Math.random() - 0.5) * Math.PI / 2;
        atoms.push({
          atom: hetero,
          position: [
            parent.position[0] + 0.8 * Math.cos(outwardAngle),
            parent.position[1] + 0.8 * Math.sin(outwardAngle),
            parent.position[2] + 0.5 * Math.sin(zAngle)
          ]
        });
        bonds.push({ from: parentIndex, to: atomIndex, order: hetero === 'O' ? 2 : 1 });
        atomIndex++;
      }
    }
  });

  // Add some hydrogens
  const hydrogenCount = Math.min(atomCounts['H'] || 0, 6);
  for (let i = 0; i < hydrogenCount; i++) {
    const parentIndex = i % carbonCount;
    const parent = atoms[parentIndex];
    if (parent) {
      const angle = Math.PI + (i * 0.8);
      atoms.push({
        atom: 'H',
        position: [
          parent.position[0] + 0.5 * Math.cos(angle),
          parent.position[1] + 0.5 * Math.sin(angle),
          parent.position[2] + (i % 2 === 0 ? 0.4 : -0.4)
        ]
      });
      bonds.push({ from: parentIndex, to: atomIndex, order: 1 });
      atomIndex++;
    }
  }

  return { atoms, bonds };
};

// 3D Atom component
const Atom3D = ({ 
  atom, 
  position, 
  isHovered,
  onHover,
  onLeave,
}: { 
  atom: string; 
  position: [number, number, number];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = atomColors[atom] || "#888888";
  const radius = atomRadii[atom] || 0.3;
  
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isHovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onPointerOver={onHover}
        onPointerOut={onLeave}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={isHovered ? 0.3 : 0.05}
        />
      </mesh>
      {isHovered && (
        <Html position={[0, radius + 0.3, 0]} center>
          <div className="bg-popover border border-border px-2 py-1 rounded shadow-lg text-xs">
            <span className="font-semibold" style={{ color }}>{atom}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// 3D Bond component
const Bond3D = ({ 
  from, 
  to, 
  order 
}: { 
  from: [number, number, number]; 
  to: [number, number, number];
  order: number;
}) => {
  const direction = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const length = direction.length();
  direction.normalize();
  
  const midpoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2
  ];
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  
  if (order === 2) {
    // Double bond - two cylinders slightly offset
    const offset = 0.05;
    const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize().multiplyScalar(offset);
    
    return (
      <group>
        <mesh position={[midpoint[0] + perpendicular.x, midpoint[1] + perpendicular.y, midpoint[2]]} quaternion={quaternion}>
          <cylinderGeometry args={[0.04, 0.04, length * 0.7, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[midpoint[0] - perpendicular.x, midpoint[1] - perpendicular.y, midpoint[2]]} quaternion={quaternion}>
          <cylinderGeometry args={[0.04, 0.04, length * 0.7, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>
    );
  }
  
  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.05, 0.05, length * 0.7, 8]} />
      <meshStandardMaterial color="#555555" />
    </mesh>
  );
};

// Molecule component that rotates
const Molecule = ({ 
  atoms, 
  bonds,
  hoveredAtom,
  setHoveredAtom,
}: { 
  atoms: { atom: string; position: [number, number, number] }[];
  bonds: { from: number; to: number; order: number }[];
  hoveredAtom: number | null;
  setHoveredAtom: (index: number | null) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      {bonds.map((bond, index) => (
        <Bond3D
          key={`bond-${index}`}
          from={atoms[bond.from].position}
          to={atoms[bond.to].position}
          order={bond.order}
        />
      ))}
      {atoms.map((atomData, index) => (
        <Atom3D
          key={`atom-${index}`}
          atom={atomData.atom}
          position={atomData.position}
          isHovered={hoveredAtom === index}
          onHover={() => setHoveredAtom(index)}
          onLeave={() => setHoveredAtom(null)}
        />
      ))}
    </group>
  );
};

// Main scene
const Scene = ({ 
  atoms, 
  bonds,
  hoveredAtom,
  setHoveredAtom,
}: { 
  atoms: { atom: string; position: [number, number, number] }[];
  bonds: { from: number; to: number; order: number }[];
  hoveredAtom: number | null;
  setHoveredAtom: (index: number | null) => void;
}) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />
      
      <Molecule
        atoms={atoms}
        bonds={bonds}
        hoveredAtom={hoveredAtom}
        setHoveredAtom={setHoveredAtom}
      />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={10}
      />
    </>
  );
};

const SchematicDiagram3D = ({
  ligandName,
  ligandCid,
  smiles = "",
  molecularFormula = "C20H25N3O",
  molecularWeight = 339.43,
  proteinName,
  pdbId,
  bindingAffinity,
  dockingScore,
}: SchematicDiagram3DProps) => {
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { atoms, bonds } = useMemo(() => 
    generate3DStructure(molecularFormula, smiles), 
    [molecularFormula, smiles]
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <Card className="p-4 bg-card" ref={containerRef}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">3D Molecular Structure</h3>
            <p className="text-sm text-muted-foreground">{ligandName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden" style={{ height: isFullscreen ? '100vh' : '350px' }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Scene
              atoms={atoms}
              bonds={bonds}
              hoveredAtom={hoveredAtom}
              setHoveredAtom={setHoveredAtom}
            />
          </Canvas>
          <div className="absolute bottom-3 left-3 text-xs text-white/60 bg-black/30 px-2 py-1 rounded">
            Drag to rotate • Scroll to zoom
          </div>
        </div>

        {/* Compound info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">CID:</span>
              <Badge variant="outline">{ligandCid}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Formula:</span>
              <span className="text-sm font-mono text-foreground">{molecularFormula}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">MW:</span>
              <span className="text-sm text-foreground">{molecularWeight?.toFixed(2)} g/mol</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Target:</span>
              <Badge variant="secondary">{pdbId}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Affinity:</span>
              <span className="text-sm font-semibold text-green-500">{bindingAffinity.toFixed(2)} kcal/mol</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Score:</span>
              <span className="text-sm font-semibold text-primary">{dockingScore.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Atom legend */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          {Object.entries(atomColors).slice(0, 7).map(([atom, color]) => (
            <div key={atom} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">{atom}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default SchematicDiagram3D;
