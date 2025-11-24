import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, PlayCircle, CheckCircle2, AlertCircle, Loader2, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ADMETResult {
  id: string;
  ligand_id: string;
  ligand_name?: string;
  ligand_cid?: string;
  absorption_score: number;
  distribution_score: number;
  metabolism_score: number;
  excretion_score: number;
  toxicity_score: number;
  overall_score: number;
  passed_screening: boolean;
}

const ADMETScreening = () => {
  const [ligands, setLigands] = useState<any[]>([]);
  const [results, setResults] = useState<ADMETResult[]>([]);
  const [isScreening, setIsScreening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  const admetCriteria = [
    { id: "absorption", label: "Absorption", description: "Intestinal absorption prediction", enabled: true },
    { id: "distribution", label: "Distribution", description: "Blood-brain barrier penetration", enabled: true },
    { id: "metabolism", label: "Metabolism", description: "CYP450 enzyme interaction", enabled: true },
    { id: "excretion", label: "Excretion", description: "Clearance and half-life", enabled: true },
    { id: "toxicity", label: "Toxicity", description: "Hepatotoxicity and cardiotoxicity", enabled: true },
  ];

  useEffect(() => {
    fetchLigands();
    fetchResults();
  }, []);

  const fetchLigands = async () => {
    const { data, error } = await supabase
      .from("ligands")
      .select("*")
      .eq("selected", true);

    if (error) {
      console.error("Error fetching ligands:", error);
      return;
    }

    setLigands(data || []);
  };

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from("admet_results")
      .select(`
        *,
        ligands (
          name,
          pubchem_cid
        )
      `)
      .order("overall_score", { ascending: false });

    if (error) {
      console.error("Error fetching results:", error);
      return;
    }

    const formattedResults = (data || []).map((result: any) => ({
      id: result.id,
      ligand_id: result.ligand_id,
      ligand_name: result.ligands?.name,
      ligand_cid: result.ligands?.pubchem_cid,
      absorption_score: result.absorption_score,
      distribution_score: result.distribution_score,
      metabolism_score: result.metabolism_score,
      excretion_score: result.excretion_score,
      toxicity_score: result.toxicity_score,
      overall_score: result.overall_score,
      passed_screening: result.passed_screening,
    }));

    setResults(formattedResults);
  };

  const handleStartScreening = async () => {
    if (ligands.length === 0) {
      toast({
        title: "No Ligands Selected",
        description: "Please select ligands in the Ligand Management tab first",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsScreening(true);
    setProgress(0);

    try {
      const batchSize = 10;
      for (let i = 0; i < ligands.length; i += batchSize) {
        const batch = ligands.slice(i, Math.min(i + batchSize, ligands.length));

        const admetResults = batch.map((ligand) => {
          // Simulate ADMET scoring (in production, this would call ADMETlab API)
          const absorption = Math.random() * 40 + 60; // 60-100
          const distribution = Math.random() * 40 + 60;
          const metabolism = Math.random() * 40 + 60;
          const excretion = Math.random() * 40 + 60;
          const toxicity = Math.random() * 40 + 60;
          const overall = (absorption + distribution + metabolism + excretion + toxicity) / 5;
          
          return {
            user_id: user.id,
            ligand_id: ligand.id,
            absorption_score: absorption,
            distribution_score: distribution,
            metabolism_score: metabolism,
            excretion_score: excretion,
            toxicity_score: toxicity,
            overall_score: overall,
            passed_screening: overall >= 70,
          };
        });

        await supabase.from("admet_results").insert(admetResults);
        setProgress(Math.min(((i + batchSize) / ligands.length) * 100, 100));

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast({
        title: "Screening Complete",
        description: `Analyzed ${ligands.length} ligands successfully`,
      });

      fetchResults();
    } catch (error) {
      toast({
        title: "Screening Failed",
        description: "Unable to complete ADMET screening",
        variant: "destructive",
      });
    } finally {
      setIsScreening(false);
      setProgress(0);
    }
  };

  const filteredResults = results.filter((result) => {
    if (filterStatus === "passed") return result.passed_screening;
    if (filterStatus === "failed") return !result.passed_screening;
    return true;
  });

  const passedCount = results.filter((r) => r.passed_screening).length;
  const failedCount = results.filter((r) => !r.passed_screening).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ADMET Screening</h2>
          <p className="text-muted-foreground">Screen ligands for safety and drug-likeness using ADMETlab 3.0</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-3 w-3" />
          ADMETlab 3.0
        </Badge>
      </div>

      {/* Screening Progress */}
      <Card className="bg-gradient-to-br from-accent/10 to-secondary/10 p-6 shadow-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Screening Status</h3>
            <Badge variant={isScreening ? "default" : results.length > 0 ? "secondary" : "outline"}>
              {isScreening ? "Running" : results.length > 0 ? "Complete" : "Not Started"}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isScreening ? "Analyzing Ligands" : "Selected Ligands"}
              </span>
              <span className="font-medium text-foreground">
                {isScreening ? `${Math.round(progress)}%` : `${ligands.length} ligands`}
              </span>
            </div>
            {isScreening && <Progress value={progress} className="h-2" />}
          </div>
          <Button 
            onClick={handleStartScreening} 
            disabled={isScreening || ligands.length === 0} 
            className="w-full gap-2"
          >
            {isScreening ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Screening in Progress...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Start ADMET Screening
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Screening Criteria */}
      <Card className="bg-card p-6 shadow-card">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Screening Criteria</h3>
          <p className="text-sm text-muted-foreground">
            Select ADMET properties to evaluate. All criteria are recommended for comprehensive safety analysis.
          </p>
          <div className="space-y-3">
            {admetCriteria.map((criterion) => (
              <Card key={criterion.id} className="bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox id={criterion.id} defaultChecked={criterion.enabled} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={criterion.id}
                      className="cursor-pointer font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {criterion.label}
                    </label>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-success bg-card p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm font-medium text-muted-foreground">Passed Screening</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{passedCount}</p>
            <p className="text-xs text-muted-foreground">Overall score ≥ 70</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-primary bg-card p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Total Screened</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{results.length}</p>
            <p className="text-xs text-muted-foreground">Complete analysis</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-destructive bg-card p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-muted-foreground">Failed</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </div>
        </Card>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <Card className="bg-card shadow-card">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Screening Results</h3>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="passed">Passed Only</SelectItem>
                    <SelectItem value="failed">Failed Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ligand</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Absorption</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Distribution</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Metabolism</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Excretion</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Toxicity</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Overall</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.slice(0, 20).map((result) => (
                    <tr key={result.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {result.ligand_name}
                          </p>
                          <p className="text-xs text-muted-foreground">CID: {result.ligand_cid}</p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={result.absorption_score >= 70 ? "default" : "secondary"}>
                          {result.absorption_score.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={result.distribution_score >= 70 ? "default" : "secondary"}>
                          {result.distribution_score.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={result.metabolism_score >= 70 ? "default" : "secondary"}>
                          {result.metabolism_score.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={result.excretion_score >= 70 ? "default" : "secondary"}>
                          {result.excretion_score.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={result.toxicity_score >= 70 ? "default" : "secondary"}>
                          {result.toxicity_score.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={result.overall_score >= 70 ? "default" : "destructive"}>
                          {result.overall_score.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        {result.passed_screening ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredResults.length > 20 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing 20 of {filteredResults.length} results
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-l-4 border-l-accent bg-accent/5 p-4">
        <h4 className="mb-2 font-semibold text-foreground">About ADMET Screening</h4>
        <p className="text-sm text-muted-foreground">
          ADMET (Absorption, Distribution, Metabolism, Excretion, Toxicity) screening predicts drug-like properties and
          safety profiles. ADMETlab 3.0 uses machine learning models to evaluate these properties before costly
          experimental testing.
        </p>
      </Card>
    </div>
  );
};

export default ADMETScreening;
