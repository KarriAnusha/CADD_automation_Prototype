import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, TrendingDown, TrendingUp } from "lucide-react";

interface CompoundData {
  id: string;
  ligand_name: string;
  protein_name: string;
  binding_affinity: number;
  docking_score: number;
  admet_overall: number;
  absorption: number;
  distribution: number;
  metabolism: number;
  excretion: number;
  toxicity: number;
  molecular_weight: number;
  h_bond_donors: number;
  h_bond_acceptors: number;
  psa: number;
}

export const CompoundComparison = () => {
  const [selectedCompounds, setSelectedCompounds] = useState<string[]>([]);
  const [compoundData, setCompoundData] = useState<CompoundData[]>([]);
  const [availableCompounds, setAvailableCompounds] = useState<CompoundData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableCompounds();
  }, []);

  const fetchAvailableCompounds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dockingData, error } = await supabase
        .from("docking_results")
        .select(`
          id,
          binding_affinity,
          docking_score,
          pose_data,
          ligands!inner(id, name),
          proteins!inner(id, name)
        `)
        .eq("user_id", user.id)
        .order("binding_affinity", { ascending: true })
        .limit(10);

      if (error) throw error;

      const compounds: CompoundData[] = await Promise.all(
        (dockingData || []).map(async (result: any) => {
          // Get most recent ADMET result for this ligand (handles multiple records)
          const { data: admetResults } = await supabase
            .from("admet_results")
            .select("*")
            .eq("ligand_id", result.ligands.id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const admetData = admetResults?.[0] || null;
          const poseData = result.pose_data as any;
          
          console.log(`Compound ${result.ligands.name} ADMET:`, admetData);
          
          return {
            id: result.id,
            ligand_name: result.ligands.name,
            protein_name: result.proteins.name,
            binding_affinity: result.binding_affinity || 0,
            docking_score: result.docking_score || 0,
            admet_overall: admetData?.overall_score || 0,
            absorption: admetData?.absorption_score || 0,
            distribution: admetData?.distribution_score || 0,
            metabolism: admetData?.metabolism_score || 0,
            excretion: admetData?.excretion_score || 0,
            toxicity: admetData?.toxicity_score || 0,
            molecular_weight: poseData?.molecular_weight || 0,
            h_bond_donors: poseData?.h_bond_donors || 0,
            h_bond_acceptors: poseData?.h_bond_acceptors || 0,
            psa: poseData?.psa || 0,
          };
        })
      );

      setAvailableCompounds(compounds);
    } catch (error: any) {
      toast({
        title: "Error loading compounds",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCompound = (compoundId: string) => {
    if (selectedCompounds.length >= 4) {
      toast({
        title: "Maximum reached",
        description: "You can compare up to 4 compounds at once",
        variant: "destructive",
      });
      return;
    }

    if (selectedCompounds.includes(compoundId)) {
      toast({
        title: "Already added",
        description: "This compound is already in comparison",
        variant: "destructive",
      });
      return;
    }

    const compound = availableCompounds.find(c => c.id === compoundId);
    if (compound) {
      setSelectedCompounds([...selectedCompounds, compoundId]);
      setCompoundData([...compoundData, compound]);
    }
  };

  const removeCompound = (compoundId: string) => {
    setSelectedCompounds(selectedCompounds.filter(id => id !== compoundId));
    setCompoundData(compoundData.filter(c => c.id !== compoundId));
  };

  const admetProperties = ["Absorption", "Distribution", "Metabolism", "Excretion", "Safety"];

  const getHeatmapValue = (compound: CompoundData, property: string): number => {
    switch (property) {
      case "Absorption": return compound.absorption;
      case "Distribution": return compound.distribution;
      case "Metabolism": return compound.metabolism;
      case "Excretion": return compound.excretion;
      case "Safety": return 100 - compound.toxicity;
      default: return 0;
    }
  };

  const getHeatmapColor = (value: number): string => {
    // Red (low) -> Yellow (mid) -> Green (high)
    const normalized = Math.max(0, Math.min(100, value)) / 100;
    if (normalized < 0.5) {
      // Red to Yellow
      const r = 239;
      const g = Math.round(68 + (normalized * 2) * (163 - 68));
      const b = 68;
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to Green
      const r = Math.round(239 - ((normalized - 0.5) * 2) * (239 - 34));
      const g = Math.round(163 + ((normalized - 0.5) * 2) * (197 - 163));
      const b = Math.round(68 - ((normalized - 0.5) * 2) * (68 - 94));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Compounds to Compare</CardTitle>
          <CardDescription>Choose up to 4 compounds to compare their properties side by side</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {availableCompounds.map((compound) => (
              <Button
                key={compound.id}
                variant="outline"
                onClick={() => addCompound(compound.id)}
                disabled={selectedCompounds.includes(compound.id)}
                className="justify-start text-left h-auto py-3"
              >
                <div className="flex flex-col gap-1 w-full">
                  <span className="font-medium truncate">{compound.ligand_name}</span>
                  <span className="text-xs text-muted-foreground">
                    BA: {compound.binding_affinity.toFixed(2)} kcal/mol
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {compoundData.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>ADMET Profile Comparison</CardTitle>
              <CardDescription>Visual comparison of pharmacological properties</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Heatmap */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground border-b">Compound</th>
                      {admetProperties.map(prop => (
                        <th key={prop} className="p-3 text-center text-sm font-medium text-muted-foreground border-b min-w-[100px]">
                          {prop}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compoundData.map((compound) => (
                      <tr key={compound.id} className="border-b last:border-b-0">
                        <td className="p-3 text-sm font-medium truncate max-w-[150px]" title={compound.ligand_name}>
                          {compound.ligand_name}
                        </td>
                        {admetProperties.map(prop => {
                          const value = getHeatmapValue(compound, prop);
                          return (
                            <td key={prop} className="p-2">
                              <div
                                className="rounded-md p-3 text-center font-semibold text-sm shadow-sm"
                                style={{ 
                                  backgroundColor: getHeatmapColor(value),
                                  color: value > 60 ? '#fff' : '#1f2937'
                                }}
                                title={`${prop}: ${value.toFixed(1)}%`}
                              >
                                {value.toFixed(0)}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Color Legend */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>Low (0%)</span>
                <div className="flex h-4 w-32 rounded overflow-hidden">
                  <div className="flex-1" style={{ backgroundColor: 'rgb(239, 68, 68)' }} />
                  <div className="flex-1" style={{ backgroundColor: 'rgb(239, 163, 68)' }} />
                  <div className="flex-1" style={{ backgroundColor: 'rgb(234, 179, 8)' }} />
                  <div className="flex-1" style={{ backgroundColor: 'rgb(132, 204, 22)' }} />
                  <div className="flex-1" style={{ backgroundColor: 'rgb(34, 197, 94)' }} />
                </div>
                <span>High (100%)</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {compoundData.map((compound, index) => (
              <Card key={compound.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{compound.ligand_name}</CardTitle>
                      <CardDescription className="truncate">{compound.protein_name}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompound(compound.id)}
                      className="h-8 w-8 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Binding Affinity</span>
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      {compound.binding_affinity.toFixed(2)} kcal/mol
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Docking Score</span>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                    <Badge variant="secondary" className="w-full justify-center">
                      {compound.docking_score.toFixed(2)}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-sm font-medium">ADMET Scores</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Overall:</span>
                        <span className="ml-1 font-medium">{compound.admet_overall.toFixed(0)}%</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Absorption:</span>
                        <span className="ml-1 font-medium">{compound.absorption.toFixed(0)}%</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Distribution:</span>
                        <span className="ml-1 font-medium">{compound.distribution.toFixed(0)}%</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Metabolism:</span>
                        <span className="ml-1 font-medium">{compound.metabolism.toFixed(0)}%</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Excretion:</span>
                        <span className="ml-1 font-medium">{compound.excretion.toFixed(0)}%</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Toxicity:</span>
                        <span className="ml-1 font-medium">{compound.toxicity.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Drug-like Properties</span>
                    <div className="space-y-1 mt-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Molecular Weight:</span>
                        <span className="font-medium">{compound.molecular_weight.toFixed(1)} Da</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">H-Bond Donors:</span>
                        <span className="font-medium">{compound.h_bond_donors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">H-Bond Acceptors:</span>
                        <span className="font-medium">{compound.h_bond_acceptors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PSA:</span>
                        <span className="font-medium">{compound.psa.toFixed(1)} Ų</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
