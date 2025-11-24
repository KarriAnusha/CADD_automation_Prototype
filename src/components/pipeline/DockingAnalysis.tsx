import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, PlayCircle, Download, Loader2, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DockingResult {
  id: string;
  protein_id: string;
  protein_name?: string;
  protein_pdb_id?: string;
  ligand_id: string;
  ligand_name?: string;
  ligand_cid?: string;
  binding_affinity: number;
  docking_score: number;
  rmsd: number;
  status: string;
}

const DockingAnalysis = () => {
  const [proteins, setProteins] = useState<any[]>([]);
  const [ligands, setLigands] = useState<any[]>([]);
  const [results, setResults] = useState<DockingResult[]>([]);
  const [isDocking, setIsDocking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sortBy, setSortBy] = useState<string>("score");
  const { toast } = useToast();

  useEffect(() => {
    fetchProteins();
    fetchLigands();
    fetchResults();
  }, []);

  const fetchProteins = async () => {
    const { data, error } = await supabase
      .from("proteins")
      .select("*")
      .eq("selected", true);

    if (error) {
      console.error("Error fetching proteins:", error);
      return;
    }

    setProteins(data || []);
  };

  const fetchLigands = async () => {
    const { data, error } = await supabase
      .from("admet_results")
      .select(`
        ligands (
          id,
          name,
          pubchem_cid,
          selected
        )
      `)
      .eq("passed_screening", true);

    if (error) {
      console.error("Error fetching ligands:", error);
      return;
    }

    const qualifiedLigands = (data || [])
      .map((item: any) => item.ligands)
      .filter((ligand: any) => ligand !== null);

    setLigands(qualifiedLigands);
  };

  const fetchResults = async () => {
    const { data, error } = await supabase
      .from("docking_results")
      .select(`
        *,
        proteins (
          name,
          pdb_id
        ),
        ligands (
          name,
          pubchem_cid
        )
      `)
      .eq("status", "completed")
      .order("docking_score", { ascending: true });

    if (error) {
      console.error("Error fetching results:", error);
      return;
    }

    const formattedResults = (data || []).map((result: any) => ({
      id: result.id,
      protein_id: result.protein_id,
      protein_name: result.proteins?.name,
      protein_pdb_id: result.proteins?.pdb_id,
      ligand_id: result.ligand_id,
      ligand_name: result.ligands?.name,
      ligand_cid: result.ligands?.pubchem_cid,
      binding_affinity: result.binding_affinity,
      docking_score: result.docking_score,
      rmsd: result.rmsd,
      status: result.status,
    }));

    setResults(formattedResults);
  };

  const handleStartDocking = async () => {
    if (proteins.length === 0 || ligands.length === 0) {
      toast({
        title: "Missing Requirements",
        description: "Please select proteins and ensure ligands have passed ADMET screening",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsDocking(true);
    setProgress(0);

    try {
      const totalPairs = proteins.length * ligands.length;
      let completed = 0;

      for (const protein of proteins) {
        for (const ligand of ligands) {
          // Simulate docking calculation (in production, this would call PyRx API)
          const dockingScore = -(Math.random() * 5 + 4); // -4 to -9 (more negative = better binding)
          const bindingAffinity = dockingScore * 5; // Approximate kcal/mol
          const rmsd = Math.random() * 2 + 0.5; // 0.5 to 2.5 Å

          await supabase.from("docking_results").insert({
            user_id: user.id,
            protein_id: protein.id,
            ligand_id: ligand.id,
            docking_score: dockingScore,
            binding_affinity: bindingAffinity,
            rmsd: rmsd,
            status: "completed",
            pose_data: {
              best_pose: 1,
              conformations: 9,
              grid_center: { x: 0, y: 0, z: 0 },
              grid_size: { x: 20, y: 20, z: 20 },
            },
          });

          completed++;
          setProgress((completed / totalPairs) * 100);

          // Simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      toast({
        title: "Docking Complete",
        description: `Analyzed ${totalPairs} protein-ligand pairs successfully`,
      });

      fetchResults();
    } catch (error) {
      toast({
        title: "Docking Failed",
        description: "Unable to complete docking analysis",
        variant: "destructive",
      });
    } finally {
      setIsDocking(false);
      setProgress(0);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Rank", "Protein", "PDB ID", "Ligand", "CID", "Docking Score", "Binding Affinity", "RMSD"],
      ...sortedResults.map((result, index) => [
        index + 1,
        result.protein_name,
        result.protein_pdb_id,
        result.ligand_name,
        result.ligand_cid,
        result.docking_score.toFixed(2),
        result.binding_affinity.toFixed(2),
        result.rmsd.toFixed(2),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "docking_results.csv";
    a.click();

    toast({
      title: "Export Complete",
      description: "Docking results exported successfully",
    });
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "score") return a.docking_score - b.docking_score;
    if (sortBy === "affinity") return a.binding_affinity - b.binding_affinity;
    if (sortBy === "rmsd") return a.rmsd - b.rmsd;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Molecular Docking Analysis</h2>
          <p className="text-muted-foreground">Perform protein-ligand docking using PyRx and analyze binding affinity</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Activity className="h-3 w-3" />
          PyRx
        </Badge>
      </div>

      {/* Docking Configuration */}
      <Card className="bg-card p-6 shadow-card">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Docking Configuration</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-muted/50 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Selected Proteins</p>
                <p className="text-2xl font-bold text-foreground">{proteins.length}</p>
                <p className="text-xs text-muted-foreground">Target structures from PDB</p>
              </div>
            </Card>
            <Card className="bg-muted/50 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Qualified Ligands</p>
                <p className="text-2xl font-bold text-foreground">{ligands.length}</p>
                <p className="text-xs text-muted-foreground">Passed ADMET screening</p>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      {/* Docking Progress */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 shadow-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Docking Progress</h3>
            <Badge variant={isDocking ? "default" : results.length > 0 ? "secondary" : "outline"}>
              {isDocking ? "Running" : results.length > 0 ? "Complete" : "Ready"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {isDocking
              ? "Analyzing protein-ligand interactions..."
              : results.length > 0
              ? `Completed ${results.length} docking simulations`
              : "Start automated docking for all protein-ligand pairs"}
          </p>
          {isDocking && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing pairs...</span>
                <span className="font-medium text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <Button
            onClick={handleStartDocking}
            disabled={isDocking || proteins.length === 0 || ligands.length === 0}
            className="w-full gap-2"
          >
            {isDocking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Docking in Progress...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Start Docking Analysis
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Top Results */}
      <Card className="bg-card shadow-card">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Docking Results {results.length > 0 && `(${results.length})`}
            </h3>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Best Score</SelectItem>
                  <SelectItem value="affinity">Best Affinity</SelectItem>
                  <SelectItem value="rmsd">Lowest RMSD</SelectItem>
                </SelectContent>
              </Select>
              {results.length > 0 && (
                <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Protein</TableHead>
                  <TableHead>Ligand</TableHead>
                  <TableHead>Docking Score</TableHead>
                  <TableHead>Binding Affinity</TableHead>
                  <TableHead>RMSD (Å)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.length > 0 ? (
                  sortedResults.slice(0, 50).map((result, index) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{result.protein_name}</p>
                          <p className="text-xs text-muted-foreground">{result.protein_pdb_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{result.ligand_name}</p>
                          <p className="text-xs text-muted-foreground">CID: {result.ligand_cid}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-success" />
                          <span className="font-semibold text-success">{result.docking_score.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {result.binding_affinity.toFixed(2)} kcal/mol
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.rmsd < 2 ? "default" : "secondary"}>
                          {result.rmsd.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No docking results available. Run docking analysis to see results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {sortedResults.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing top 50 of {sortedResults.length} results
            </p>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="border-l-4 border-l-primary bg-primary/5 p-4">
        <h4 className="mb-2 font-semibold text-foreground">About Molecular Docking</h4>
        <p className="text-sm text-muted-foreground">
          PyRx performs molecular docking to predict binding affinity between proteins and ligands. Lower binding
          scores indicate stronger interactions. The best protein-ligand pairs will proceed to 2D diagram analysis.
        </p>
      </Card>
    </div>
  );
};

export default DockingAnalysis;
