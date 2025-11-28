import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Atom, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import InteractionDiagram2D from "./InteractionDiagram2D";
import SchematicDiagram from "./SchematicDiagram";

interface DockingCompound {
  id: string;
  proteinName: string;
  pdbId: string;
  ligandName: string;
  ligandCid: string;
  ligandId: string;
  smiles?: string;
  molecularFormula?: string;
  molecularWeight?: number;
  bindingAffinity: number;
  dockingScore: number;
  dockingResultId: string;
}

const InteractionDiagrams = () => {
  const [compounds, setCompounds] = useState<DockingCompound[]>([]);
  const [selectedCompound, setSelectedCompound] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompounds();
  }, []);

  const fetchCompounds = async () => {
    setLoading(true);
    try {
      const { data: dockingResults, error } = await supabase
        .from("docking_results")
        .select(`
          id,
          binding_affinity,
          docking_score,
          proteins (
            name,
            pdb_id
          ),
          ligands (
            id,
            name,
            pubchem_cid,
            smiles,
            molecular_formula,
            molecular_weight
          )
        `)
        .eq("status", "completed")
        .order("docking_score", { ascending: true })
        .limit(50);

      if (error) throw error;

      const mappedCompounds: DockingCompound[] = dockingResults?.map((result: any) => ({
        id: result.id,
        proteinName: result.proteins?.name || "Unknown",
        pdbId: result.proteins?.pdb_id || "N/A",
        ligandName: result.ligands?.name || "Unknown",
        ligandCid: result.ligands?.pubchem_cid || "N/A",
        ligandId: result.ligands?.id || "",
        smiles: result.ligands?.smiles,
        molecularFormula: result.ligands?.molecular_formula,
        molecularWeight: result.ligands?.molecular_weight,
        bindingAffinity: result.binding_affinity || 0,
        dockingScore: result.docking_score || 0,
        dockingResultId: result.id,
      })) || [];

      setCompounds(mappedCompounds);
      if (mappedCompounds.length > 0) {
        setSelectedCompound(mappedCompounds[0].id);
      }
    } catch (error) {
      console.error("Error fetching compounds:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentCompound = compounds.find(c => c.id === selectedCompound);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interaction data...</p>
        </div>
      </div>
    );
  }

  if (compounds.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Atom className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Docking Results</h3>
        <p className="text-muted-foreground">
          Complete the molecular docking stage to view 2D interaction diagrams
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">2D Interaction Diagrams</h2>
          <p className="text-muted-foreground">Visualize protein-ligand interactions</p>
        </div>
        
        <Select value={selectedCompound} onValueChange={setSelectedCompound}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a compound" />
          </SelectTrigger>
          <SelectContent>
            {compounds.map((compound, index) => (
              <SelectItem key={compound.id} value={compound.id}>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">#{index + 1}</span>
                  <span>{compound.ligandName}</span>
                  <span className="text-muted-foreground">({compound.dockingScore.toFixed(2)})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentCompound && (
        <Tabs defaultValue="interactive" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="interactive" className="gap-2">
              <Network className="h-4 w-4" />
              Interactive Diagram
            </TabsTrigger>
            <TabsTrigger value="schematic" className="gap-2">
              <Atom className="h-4 w-4" />
              Schematic View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactive">
            <InteractionDiagram2D
              ligandName={currentCompound.ligandName}
              ligandCid={currentCompound.ligandCid}
              proteinName={currentCompound.proteinName}
              pdbId={currentCompound.pdbId}
              bindingAffinity={currentCompound.bindingAffinity}
              dockingResultId={currentCompound.dockingResultId}
            />
          </TabsContent>

          <TabsContent value="schematic">
            <SchematicDiagram
              ligandName={currentCompound.ligandName}
              ligandCid={currentCompound.ligandCid}
              smiles={currentCompound.smiles}
              molecularFormula={currentCompound.molecularFormula}
              molecularWeight={currentCompound.molecularWeight}
              proteinName={currentCompound.proteinName}
              pdbId={currentCompound.pdbId}
              bindingAffinity={currentCompound.bindingAffinity}
              dockingScore={currentCompound.dockingScore}
              dockingResultId={currentCompound.dockingResultId}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Quick compare section */}
      {compounds.length >= 2 && (
        <Card className="p-4 bg-card">
          <h3 className="font-semibold text-foreground mb-4">Quick Compare Top 3</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {compounds.slice(0, 3).map((compound, index) => (
              <Card
                key={compound.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-elevated ${
                  selectedCompound === compound.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedCompound(compound.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      #{index + 1} {compound.ligandName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {compound.proteinName} ({compound.pdbId})
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Score:</span>
                    <span className="font-semibold text-primary">{compound.dockingScore.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Affinity:</span>
                    <span className="font-semibold text-success">{compound.bindingAffinity.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default InteractionDiagrams;
