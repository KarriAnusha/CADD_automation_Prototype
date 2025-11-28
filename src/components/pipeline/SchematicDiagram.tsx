import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut } from "lucide-react";

interface SchematicDiagramProps {
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

// Simple 2D structure visualization based on molecular formula
const generateStructureElements = (formula: string, smiles: string) => {
  const elements: { atom: string; x: number; y: number; bonds: number[] }[] = [];
  
  // Parse atoms from formula or SMILES
  const atomCounts: Record<string, number> = {};
  const atomMatches = formula?.match(/([A-Z][a-z]?)(\d*)/g) || [];
  
  atomMatches.forEach(match => {
    const [, atom, count] = match.match(/([A-Z][a-z]?)(\d*)/) || [];
    if (atom) {
      atomCounts[atom] = parseInt(count) || 1;
    }
  });

  // Generate simplified structure layout
  let index = 0;
  const atomPositions: { atom: string; x: number; y: number }[] = [];
  
  // Carbon backbone
  const carbonCount = atomCounts['C'] || 6;
  const limitedCarbons = Math.min(carbonCount, 12);
  
  for (let i = 0; i < limitedCarbons; i++) {
    const angle = (i / limitedCarbons) * 2 * Math.PI;
    const radius = 80;
    atomPositions.push({
      atom: 'C',
      x: 150 + radius * Math.cos(angle + Math.PI / 6),
      y: 150 + radius * Math.sin(angle + Math.PI / 6),
    });
  }

  // Add other atoms around carbons
  const otherAtoms = ['O', 'N', 'S', 'F', 'Cl', 'Br', 'P'];
  let otherIndex = 0;
  
  otherAtoms.forEach(atom => {
    const count = Math.min(atomCounts[atom] || 0, 4);
    for (let i = 0; i < count; i++) {
      const parentCarbon = atomPositions[otherIndex % atomPositions.length];
      if (parentCarbon) {
        const offsetAngle = (otherIndex * 0.7) + Math.PI / 4;
        atomPositions.push({
          atom,
          x: parentCarbon.x + 40 * Math.cos(offsetAngle),
          y: parentCarbon.y + 40 * Math.sin(offsetAngle),
        });
        otherIndex++;
      }
    }
  });

  // Add hydrogens (simplified - just show a few)
  const hydrogenCount = Math.min(atomCounts['H'] || 0, 6);
  for (let i = 0; i < hydrogenCount; i++) {
    const parentCarbon = atomPositions[i % Math.min(atomPositions.length, limitedCarbons)];
    if (parentCarbon) {
      const offsetAngle = Math.PI + (i * 0.5);
      atomPositions.push({
        atom: 'H',
        x: parentCarbon.x + 30 * Math.cos(offsetAngle),
        y: parentCarbon.y + 30 * Math.sin(offsetAngle),
      });
    }
  }

  return atomPositions;
};

const atomColors: Record<string, string> = {
  C: "hsl(var(--foreground))",
  O: "hsl(0, 70%, 50%)",
  N: "hsl(220, 70%, 50%)",
  S: "hsl(45, 80%, 50%)",
  H: "hsl(var(--muted-foreground))",
  F: "hsl(142, 70%, 45%)",
  Cl: "hsl(142, 70%, 35%)",
  Br: "hsl(15, 70%, 45%)",
  P: "hsl(280, 70%, 50%)",
};

const SchematicDiagram = ({
  ligandName,
  ligandCid,
  smiles = "",
  molecularFormula = "C20H25N3O",
  molecularWeight = 339.43,
  proteinName,
  pdbId,
  bindingAffinity,
  dockingScore,
}: SchematicDiagramProps) => {
  const [zoom, setZoom] = useState(1);
  
  const structureElements = generateStructureElements(molecularFormula, smiles);

  const handleExportSVG = () => {
    const svg = document.getElementById(`schematic-${ligandCid}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ligandName}_schematic.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="p-4 bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Schematic 2D Structure</h3>
            <p className="text-sm text-muted-foreground">{ligandName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportSVG}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center p-4">
          <svg
            id={`schematic-${ligandCid}`}
            width={300 * zoom}
            height={300 * zoom}
            viewBox="0 0 300 300"
            className="max-w-full"
          >
            {/* Draw bonds between adjacent carbons */}
            {structureElements.slice(0, Math.min(12, structureElements.filter(e => e.atom === 'C').length)).map((elem, i, arr) => {
              if (i < arr.length - 1) {
                const next = arr[(i + 1) % arr.length];
                return (
                  <line
                    key={`bond-${i}`}
                    x1={elem.x}
                    y1={elem.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                );
              }
              return null;
            })}

            {/* Close the ring */}
            {structureElements.length > 2 && (
              <line
                x1={structureElements[0]?.x}
                y1={structureElements[0]?.y}
                x2={structureElements[Math.min(11, structureElements.filter(e => e.atom === 'C').length - 1)]?.x}
                y2={structureElements[Math.min(11, structureElements.filter(e => e.atom === 'C').length - 1)]?.y}
                stroke="hsl(var(--foreground))"
                strokeWidth="2"
                opacity="0.6"
              />
            )}

            {/* Draw bonds to heteroatoms */}
            {structureElements.filter(e => e.atom !== 'C' && e.atom !== 'H').map((elem, i) => {
              const carbonIndex = i % Math.min(12, structureElements.filter(e => e.atom === 'C').length);
              const carbon = structureElements[carbonIndex];
              if (carbon) {
                return (
                  <line
                    key={`hetero-bond-${i}`}
                    x1={carbon.x}
                    y1={carbon.y}
                    x2={elem.x}
                    y2={elem.y}
                    stroke={atomColors[elem.atom] || "hsl(var(--foreground))"}
                    strokeWidth="2"
                    opacity="0.8"
                  />
                );
              }
              return null;
            })}

            {/* Draw atoms */}
            {structureElements.map((elem, i) => (
              <g key={i}>
                <circle
                  cx={elem.x}
                  cy={elem.y}
                  r={elem.atom === 'H' ? 8 : 12}
                  fill="hsl(var(--card))"
                  stroke={atomColors[elem.atom] || "hsl(var(--foreground))"}
                  strokeWidth="2"
                />
                <text
                  x={elem.x}
                  y={elem.y + 4}
                  fill={atomColors[elem.atom] || "hsl(var(--foreground))"}
                  fontSize={elem.atom === 'H' ? "8" : "10"}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {elem.atom}
                </text>
              </g>
            ))}
          </svg>
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
              <span className="text-sm font-semibold text-success">{bindingAffinity.toFixed(2)} kcal/mol</span>
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
                className="w-3 h-3 rounded-full border-2"
                style={{ borderColor: color }}
              />
              <span className="text-xs text-muted-foreground">{atom}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default SchematicDiagram;
