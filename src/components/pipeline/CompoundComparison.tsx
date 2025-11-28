import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, TrendingDown, TrendingUp } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts";

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
          const { data: admetData } = await supabase
            .from("admet_results")
            .select("*")
            .eq("ligand_id", result.ligands.id)
            .eq("user_id", user.id)
            .single();

          const poseData = result.pose_data as any;
          
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

  const getRadarData = () => {
    return [
      { metric: "Absorption", ...Object.fromEntries(compoundData.map((c, i) => [`compound${i}`, c.absorption])) },
      { metric: "Distribution", ...Object.fromEntries(compoundData.map((c, i) => [`compound${i}`, c.distribution])) },
      { metric: "Metabolism", ...Object.fromEntries(compoundData.map((c, i) => [`compound${i}`, c.metabolism])) },
      { metric: "Excretion", ...Object.fromEntries(compoundData.map((c, i) => [`compound${i}`, c.excretion])) },
      { metric: "Toxicity", ...Object.fromEntries(compoundData.map((c, i) => [`compound${i}`, 100 - c.toxicity])) },
    ];
  };

  const colors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

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
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  {compoundData.map((compound, index) => (
                    <Radar
                      key={compound.id}
                      name={compound.ligand_name}
                      dataKey={`compound${index}`}
                      stroke={colors[index]}
                      fill={colors[index]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
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
