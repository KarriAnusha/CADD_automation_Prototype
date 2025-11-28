import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  interactions: providedInteractions,
}: InteractionDiagram2DProps) => {
  const [hoveredInteraction, setHoveredInteraction] = useState<number | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (providedInteractions && providedInteractions.length > 0) {
      setInteractions(providedInteractions);
    } else {
      setInteractions(generateInteractions(ligandCid, pdbId));
    }
  }, [ligandCid, pdbId, providedInteractions]);

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

  return (
    <Card className="p-4 bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">2D Interaction Diagram</h3>
            <p className="text-sm text-muted-foreground">{ligandName} - {proteinName}</p>
          </div>
          <Badge variant="outline">{bindingAffinity.toFixed(2)} kcal/mol</Badge>
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
