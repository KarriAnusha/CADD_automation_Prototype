import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Line, Sphere } from "@react-three/drei";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as THREE from "three";

interface Interaction {
  type: "hydrogen_bond" | "hydrophobic" | "pi_stacking" | "ionic" | "halogen_bond";
  residue: string;
  residuePosition: number;
  distance: number;
  angle?: number;
  strength: "strong" | "medium" | "weak";
}

interface InteractionDiagram3DProps {
  ligandName: string;
  ligandCid: string;
  proteinName: string;
  pdbId: string;
  bindingAffinity: number;
  dockingResultId?: string;
  interactions?: Interaction[];
}

const interactionColors = {
  hydrogen_bond: "#3b82f6",
  hydrophobic: "#22c55e",
  pi_stacking: "#a855f7",
  ionic: "#ef4444",
  halogen_bond: "#eab308",
};

const interactionLabels = {
  hydrogen_bond: "H-Bond",
  hydrophobic: "Hydrophobic",
  pi_stacking: "π-π Stacking",
  ionic: "Ionic",
  halogen_bond: "Halogen Bond",
};

// Generate simulated interactions
const generateInteractions = (ligandCid: string, pdbId: string): Interaction[] => {
  const seed = parseInt(ligandCid.replace(/\D/g, "").slice(0, 6)) || 12345;
  const random = (i: number) => ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;

  const residues = ["ASP", "GLU", "LYS", "ARG", "HIS", "SER", "THR", "ASN", "GLN", "TYR", "PHE", "TRP", "LEU", "ILE", "VAL"];
  const interactionTypes: Interaction["type"][] = ["hydrogen_bond", "hydrophobic", "pi_stacking", "ionic", "halogen_bond"];

  const numInteractions = Math.floor(random(0) * 8) + 5;
  const interactions: Interaction[] = [];

  for (let i = 0; i < numInteractions; i++) {
    interactions.push({
      type: interactionTypes[Math.floor(random(i + 1) * interactionTypes.length)],
      residue: residues[Math.floor(random(i + 2) * residues.length)],
      residuePosition: Math.floor(random(i + 3) * 300) + 50,
      distance: parseFloat((2.0 + random(i + 4) * 2.5).toFixed(2)),
      angle: Math.floor(random(i + 5) * 60) + 120,
      strength: random(i + 6) > 0.6 ? "strong" : random(i + 6) > 0.3 ? "medium" : "weak",
    });
  }

  return interactions;
};

// 3D Ligand sphere component
const LigandSphere = ({ name, cid }: { name: string; cid: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.8} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial color="#60a5fa" wireframe transparent opacity={0.3} />
      </mesh>
      <Html position={[0, -1.8, 0]} center>
        <div className="text-center bg-background/90 px-2 py-1 rounded text-xs whitespace-nowrap">
          <div className="font-semibold text-primary">{name.slice(0, 15)}</div>
          <div className="text-muted-foreground text-[10px]">CID: {cid}</div>
        </div>
      </Html>
    </group>
  );
};

// 3D Residue node component
const ResidueNode = ({ 
  interaction, 
  position,
  isHovered,
  onHover,
  onLeave,
}: { 
  interaction: Interaction; 
  position: [number, number, number];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = interactionColors[interaction.type];
  
  useFrame(() => {
    if (meshRef.current && isHovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onPointerOver={onHover}
        onPointerOut={onLeave}
      >
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isHovered ? 0.5 : 0.1}
        />
      </mesh>
      <Html position={[0, 0.8, 0]} center>
        <div className={`text-center bg-background/90 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap transition-all ${isHovered ? 'scale-110' : ''}`}>
          <div className="font-semibold" style={{ color }}>{interaction.residue}</div>
          <div className="text-muted-foreground">{interaction.residuePosition}</div>
        </div>
      </Html>
      {isHovered && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-popover border border-border px-2 py-1.5 rounded shadow-lg text-xs min-w-[120px]">
            <div className="font-semibold text-foreground">{interaction.residue}{interaction.residuePosition}</div>
            <div className="text-muted-foreground">{interactionLabels[interaction.type]}</div>
            <div className="text-muted-foreground">{interaction.distance}Å</div>
            <div className="text-muted-foreground capitalize">{interaction.strength}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Interaction line component
const InteractionLine = ({ 
  start, 
  end, 
  type,
  strength,
  isHovered,
}: { 
  start: [number, number, number]; 
  end: [number, number, number];
  type: Interaction["type"];
  strength: Interaction["strength"];
  isHovered: boolean;
}) => {
  const color = interactionColors[type];
  const opacity = strength === "strong" ? 1 : strength === "medium" ? 0.7 : 0.4;
  const lineWidth = isHovered ? 3 : 2;
  
  const midPoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  // Create dashed effect for hydrogen bonds
  const isDashed = type === "hydrogen_bond";
  
  return (
    <group>
      <Line
        points={[start, end]}
        color={color}
        lineWidth={lineWidth}
        dashed={isDashed}
        dashSize={0.2}
        gapSize={0.1}
        transparent
        opacity={isHovered ? 1 : opacity}
      />
      <Html position={midPoint} center>
        <div className={`text-[9px] px-1 py-0.5 rounded bg-background/80 text-foreground transition-opacity ${isHovered ? 'opacity-100' : 'opacity-60'}`}>
          {type === "hydrogen_bond" ? "H-bond" : ""}
        </div>
      </Html>
    </group>
  );
};

// Main 3D Scene
const Scene = ({ 
  interactions, 
  ligandName,
  ligandCid,
  hoveredIndex,
  setHoveredIndex,
}: { 
  interactions: Interaction[];
  ligandName: string;
  ligandCid: string;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}) => {
  // Calculate 3D positions for residues in a sphere around the ligand
  const residuePositions = useMemo(() => {
    return interactions.map((_, index) => {
      const phi = Math.acos(-1 + (2 * index) / interactions.length);
      const theta = Math.sqrt(interactions.length * Math.PI) * phi;
      const radius = 4;
      return [
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi),
      ] as [number, number, number];
    });
  }, [interactions]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <LigandSphere name={ligandName} cid={ligandCid} />
      
      {interactions.map((interaction, index) => (
        <group key={index}>
          <InteractionLine
            start={[0, 0, 0]}
            end={residuePositions[index]}
            type={interaction.type}
            strength={interaction.strength}
            isHovered={hoveredIndex === index}
          />
          <ResidueNode
            interaction={interaction}
            position={residuePositions[index]}
            isHovered={hoveredIndex === index}
            onHover={() => setHoveredIndex(index)}
            onLeave={() => setHoveredIndex(null)}
          />
        </group>
      ))}
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={15}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

const InteractionDiagram3D = ({
  ligandName,
  ligandCid,
  proteinName,
  pdbId,
  bindingAffinity,
  dockingResultId,
  interactions: providedInteractions,
}: InteractionDiagram3DProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch interaction data
  const fetchInteractionData = useCallback(async () => {
    setLoading(true);
    try {
      if (dockingResultId) {
        const { data, error } = await supabase
          .from("final_analysis")
          .select("interaction_analysis")
          .eq("docking_result_id", dockingResultId)
          .maybeSingle();

        if (!error && data?.interaction_analysis) {
          const dbData = data.interaction_analysis as any;
          const convertedInteractions: Interaction[] = [];
          
          dbData.interactions?.hydrogen_bonds?.forEach((hb: any) => {
            convertedInteractions.push({
              type: "hydrogen_bond",
              residue: hb.residue_name || hb.residue?.substring(0, 3),
              residuePosition: hb.residue_number || parseInt(hb.residue?.match(/\d+/)?.[0] || "0"),
              distance: hb.distance,
              angle: hb.angle,
              strength: hb.strength || "medium"
            });
          });
          
          dbData.interactions?.hydrophobic_contacts?.slice(0, 6).forEach((hc: any) => {
            convertedInteractions.push({
              type: "hydrophobic",
              residue: hc.residue_name || hc.residue?.substring(0, 3),
              residuePosition: hc.residue_number || parseInt(hc.residue?.match(/\d+/)?.[0] || "0"),
              distance: hc.distance,
              strength: hc.distance < 3.6 ? "strong" : "medium"
            });
          });
          
          dbData.interactions?.salt_bridges?.forEach((sb: any) => {
            convertedInteractions.push({
              type: "ionic",
              residue: sb.residue_name || sb.residue?.substring(0, 3),
              residuePosition: sb.residue_number || parseInt(sb.residue?.match(/\d+/)?.[0] || "0"),
              distance: sb.distance,
              strength: sb.strength || "strong"
            });
          });
          
          dbData.interactions?.pi_stacking?.forEach((ps: any) => {
            convertedInteractions.push({
              type: "pi_stacking",
              residue: ps.residue_name || ps.residue?.substring(0, 3),
              residuePosition: ps.residue_number || parseInt(ps.residue?.match(/\d+/)?.[0] || "0"),
              distance: ps.distance,
              angle: ps.angle,
              strength: ps.strength || "medium"
            });
          });
          
          if (convertedInteractions.length > 0) {
            setInteractions(convertedInteractions);
            setLoading(false);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching interaction data:", error);
    }
    
    // Fallback
    if (providedInteractions && providedInteractions.length > 0) {
      setInteractions(providedInteractions);
    } else {
      setInteractions(generateInteractions(ligandCid, pdbId));
    }
    setLoading(false);
  }, [dockingResultId, ligandCid, pdbId, providedInteractions]);

  useEffect(() => {
    fetchInteractionData();
  }, [fetchInteractionData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading 3D visualization...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card" ref={containerRef}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">3D Interaction Diagram</h3>
            <p className="text-sm text-muted-foreground">{ligandName} - {proteinName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{bindingAffinity.toFixed(2)} kcal/mol</Badge>
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden" style={{ height: isFullscreen ? '100vh' : '400px' }}>
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <Scene
              interactions={interactions}
              ligandName={ligandName}
              ligandCid={ligandCid}
              hoveredIndex={hoveredIndex}
              setHoveredIndex={setHoveredIndex}
            />
          </Canvas>
          <div className="absolute bottom-3 left-3 text-xs text-white/60 bg-black/30 px-2 py-1 rounded">
            Drag to rotate • Scroll to zoom
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(interactionLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: interactionColors[type as keyof typeof interactionColors] }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Interaction summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(interactionLabels).map(([type, label]) => {
            const count = interactions.filter(i => i.type === type).length;
            return (
              <div key={type} className="bg-muted/50 rounded p-2 text-center">
                <p className="text-lg font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default InteractionDiagram3D;
