import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Interaction {
  type: "hydrogen_bond" | "hydrophobic" | "pi_stacking" | "ionic" | "halogen_bond";
  residue: string;
  residuePosition: number;
  distance: number;
  angle?: number;
  strength: "strong" | "medium" | "weak";
}

interface InteractionDiagram2DProps {
  ligandName: string;
  ligandCid: string;
  proteinName: string;
  pdbId: string;
  bindingAffinity: number;
  dockingResultId?: string;
  interactions?: Interaction[];
}

// Generate simulated interactions based on compound properties
const generateInteractions = (ligandCid: string, pdbId: string): Interaction[] => {
  const seed = parseInt(ligandCid.replace(/\D/g, "").slice(0, 6)) || 12345;
  const random = (i: number) => ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;

  const residues = [
    "ASP", "GLU", "LYS", "ARG", "HIS", "SER", "THR", "ASN", "GLN",
    "TYR", "PHE", "TRP", "LEU", "ILE", "VAL", "ALA", "MET", "CYS"
  ];

  const interactionTypes: Interaction["type"][] = [
    "hydrogen_bond", "hydrophobic", "pi_stacking", "ionic", "halogen_bond"
  ];

  const numInteractions = Math.floor(random(0) * 8) + 4; // 4-12 interactions
  const interactions: Interaction[] = [];

  for (let i = 0; i < numInteractions; i++) {
    const typeIndex = Math.floor(random(i + 1) * interactionTypes.length);
    const residueIndex = Math.floor(random(i + 2) * residues.length);
    const position = Math.floor(random(i + 3) * 300) + 50;
    const distance = 2.0 + random(i + 4) * 2.5;
    const strengthVal = random(i + 5);

    interactions.push({
      type: interactionTypes[typeIndex],
      residue: residues[residueIndex],
      residuePosition: position,
      distance: parseFloat(distance.toFixed(2)),
      angle: typeIndex === 0 ? Math.floor(random(i + 6) * 60) + 120 : undefined,
      strength: strengthVal > 0.6 ? "strong" : strengthVal > 0.3 ? "medium" : "weak",
    });
  }

  return interactions;
};

const interactionColors = {
  hydrogen_bond: "hsl(var(--primary))",
  hydrophobic: "hsl(142, 71%, 45%)",
  pi_stacking: "hsl(280, 70%, 60%)",
  ionic: "hsl(0, 70%, 60%)",
  halogen_bond: "hsl(45, 90%, 50%)",
};

const interactionLabels = {
  hydrogen_bond: "H-Bond",
  hydrophobic: "Hydrophobic",
  pi_stacking: "π-π Stacking",
  ionic: "Ionic",
  halogen_bond: "Halogen Bond",
};

const strengthOpacity = {
  strong: 1,
  medium: 0.7,
  weak: 0.4,
};

const InteractionDiagram2D = ({
  ligandName,
  ligandCid,
  proteinName,
  pdbId,
  bindingAffinity,
  dockingResultId,
  interactions: providedInteractions,
}: InteractionDiagram2DProps) => {
  const [hoveredInteraction, setHoveredInteraction] = useState<number | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbInteractionData, setDbInteractionData] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch interaction data from database if dockingResultId is provided
  const fetchInteractionData = useCallback(async () => {
    if (!dockingResultId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("final_analysis")
        .select("interaction_analysis")
        .eq("docking_result_id", dockingResultId)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.interaction_analysis) {
        setDbInteractionData(data.interaction_analysis);
        // Convert database interactions to component format
        const dbData = data.interaction_analysis as any;
        const convertedInteractions: Interaction[] = [];
        
        // Convert hydrogen bonds
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
        
        // Convert hydrophobic contacts
        dbData.interactions?.hydrophobic_contacts?.slice(0, 6).forEach((hc: any) => {
          convertedInteractions.push({
            type: "hydrophobic",
            residue: hc.residue_name || hc.residue?.substring(0, 3),
            residuePosition: hc.residue_number || parseInt(hc.residue?.match(/\d+/)?.[0] || "0"),
            distance: hc.distance,
            strength: hc.distance < 3.6 ? "strong" : "medium"
          });
        });
        
        // Convert salt bridges
        dbData.interactions?.salt_bridges?.forEach((sb: any) => {
          convertedInteractions.push({
            type: "ionic",
            residue: sb.residue_name || sb.residue?.substring(0, 3),
            residuePosition: sb.residue_number || parseInt(sb.residue?.match(/\d+/)?.[0] || "0"),
            distance: sb.distance,
            strength: sb.strength || "strong"
          });
        });
        
        // Convert pi stacking
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
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching interaction data:", error);
    } finally {
      setLoading(false);
    }
    
    // Fallback to generated data if no database data
    if (providedInteractions && providedInteractions.length > 0) {
      setInteractions(providedInteractions);
    } else {
      setInteractions(generateInteractions(ligandCid, pdbId));
    }
  }, [dockingResultId, ligandCid, pdbId, providedInteractions]);

  useEffect(() => {
    fetchInteractionData();
  }, [fetchInteractionData]);

  const width = 500;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const ligandRadius = 50;
  const interactionRadius = 160;

  // Calculate positions for residues around the ligand
  const getResiduePosition = (index: number, total: number) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      x: centerX + interactionRadius * Math.cos(angle),
      y: centerY + interactionRadius * Math.sin(angle),
    };
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading interactions...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">2D Interaction Diagram</h3>
            <p className="text-sm text-muted-foreground">{ligandName} - {proteinName}</p>
          </div>
          <div className="flex items-center gap-2">
            {dbInteractionData && <Badge variant="default" className="text-xs">From Database</Badge>}
            <Badge variant="outline">{bindingAffinity.toFixed(2)} kcal/mol</Badge>
          </div>
        </div>

        <div className="relative bg-muted/30 rounded-lg overflow-hidden">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            className="max-w-full"
          >
            {/* Interaction lines */}
            {interactions.map((interaction, index) => {
              const pos = getResiduePosition(index, interactions.length);
              const isHovered = hoveredInteraction === index;
              const color = interactionColors[interaction.type];
              const opacity = strengthOpacity[interaction.strength];

              return (
                <g key={index}>
                  {/* Dashed line for interaction */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={pos.x}
                    y2={pos.y}
                    stroke={color}
                    strokeWidth={isHovered ? 3 : 2}
                    strokeDasharray={interaction.type === "hydrogen_bond" ? "8,4" : "none"}
                    opacity={isHovered ? 1 : opacity}
                    className="transition-all duration-200"
                  />
                  {/* Distance label */}
                  <text
                    x={(centerX + pos.x) / 2}
                    y={(centerY + pos.y) / 2 - 8}
                    fill="hsl(var(--foreground))"
                    fontSize="10"
                    textAnchor="middle"
                    opacity={isHovered ? 1 : 0.7}
                  >
                    {interaction.distance}Å
                  </text>
                </g>
              );
            })}

            {/* Ligand center */}
            <circle
              cx={centerX}
              cy={centerY}
              r={ligandRadius}
              fill="hsl(var(--primary) / 0.2)"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
            />
            <text
              x={centerX}
              y={centerY - 10}
              fill="hsl(var(--foreground))"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              {ligandName.slice(0, 12)}
            </text>
            <text
              x={centerX}
              y={centerY + 8}
              fill="hsl(var(--muted-foreground))"
              fontSize="10"
              textAnchor="middle"
            >
              CID: {ligandCid}
            </text>

            {/* Residue nodes */}
            {interactions.map((interaction, index) => {
              const pos = getResiduePosition(index, interactions.length);
              const isHovered = hoveredInteraction === index;
              const color = interactionColors[interaction.type];

              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredInteraction(index)}
                      onMouseLeave={() => setHoveredInteraction(null)}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHovered ? 32 : 28}
                        fill={isHovered ? color : "hsl(var(--card))"}
                        stroke={color}
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-200"
                      />
                      <text
                        x={pos.x}
                        y={pos.y - 6}
                        fill="hsl(var(--foreground))"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {interaction.residue}
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 8}
                        fill="hsl(var(--muted-foreground))"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {interaction.residuePosition}
                      </text>
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{interaction.residue}{interaction.residuePosition}</p>
                      <p className="text-sm">Type: {interactionLabels[interaction.type]}</p>
                      <p className="text-sm">Distance: {interaction.distance}Å</p>
                      {interaction.angle && <p className="text-sm">Angle: {interaction.angle}°</p>}
                      <p className="text-sm">Strength: {interaction.strength}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(interactionLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-4 h-1 rounded"
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

export default InteractionDiagram2D;
