import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Download, FileText, BarChart3, TrendingDown, Award, Beaker, 
  Search, Filter, Eye, FileSpreadsheet, ArrowUpDown, Activity,
  AlertTriangle, CheckCircle2, XCircle, ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import InteractionDiagram2D from "./InteractionDiagram2D";

interface TopCompound {
  id: string;
  protein_name: string;
  protein_pdb_id: string;
  ligand_name: string;
  ligand_cid: string;
  ligand_smiles?: string;
  ligand_formula?: string;
  ligand_weight?: number;
  docking_score: number;
  binding_affinity: number;
  rmsd: number;
  admet_score?: number;
  absorption_score?: number;
  distribution_score?: number;
  metabolism_score?: number;
  excretion_score?: number;
  toxicity_score?: number;
  passed_admet?: boolean;
  interaction_count?: number;
}

interface InteractionData {
  summary?: {
    total_interactions: number;
    hydrogen_bonds: number;
    hydrophobic_contacts: number;
    salt_bridges: number;
    pi_stacking: number;
  };
  interactions?: any;
  quality_assessment?: {
    interaction_density: string;
    binding_mode: string;
    predicted_selectivity: string;
  };
}

type SortField = "docking_score" | "binding_affinity" | "admet_score" | "rmsd";
type SortOrder = "asc" | "desc";

interface ResultsDashboardProps {
  onNavigate?: (tab: string) => void;
}

const ADMET_COLORS = {
  absorption: "hsl(var(--chart-1))",
  distribution: "hsl(var(--chart-2))",
  metabolism: "hsl(var(--chart-3))",
  excretion: "hsl(var(--chart-4))",
  toxicity: "hsl(var(--chart-5))",
};

const ResultsDashboard = ({ onNavigate }: ResultsDashboardProps) => {
  const [stats, setStats] = useState({
    proteinsCount: 0,
    ligandsCount: 0,
    safeCompounds: 0,
    failedCompounds: 0,
    dockingCompleted: 0,
    bestBinding: 0,
  });
  const [topCompounds, setTopCompounds] = useState<TopCompound[]>([]);
  const [filteredCompounds, setFilteredCompounds] = useState<TopCompound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("docking_score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterAdmet, setFilterAdmet] = useState<string>("all");
  const [selectedCompound, setSelectedCompound] = useState<TopCompound | null>(null);
  const [interactionData, setInteractionData] = useState<InteractionData | null>(null);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [topCompounds, searchQuery, sortField, sortOrder, filterAdmet]);

  const applyFiltersAndSort = () => {
    let filtered = [...topCompounds];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.ligand_name.toLowerCase().includes(query) ||
          c.ligand_cid.toLowerCase().includes(query) ||
          c.protein_name.toLowerCase().includes(query) ||
          c.protein_pdb_id.toLowerCase().includes(query)
      );
    }

    // Apply ADMET filter
    if (filterAdmet === "passed") {
      filtered = filtered.filter((c) => c.passed_admet === true);
    } else if (filterAdmet === "failed") {
      filtered = filtered.filter((c) => c.passed_admet === false);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField] ?? 0;
      let bVal = b[sortField] ?? 0;
      if (sortOrder === "asc") {
        return aVal - bVal;
      }
      return bVal - aVal;
    });

    setFilteredCompounds(filtered);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch statistics
      const [proteinsRes, ligandsRes, admetPassedRes, admetFailedRes, dockingRes, bestDockingRes] = await Promise.all([
        supabase.from("proteins").select("id", { count: "exact", head: true }),
        supabase.from("ligands").select("id", { count: "exact", head: true }),
        supabase.from("admet_results").select("id", { count: "exact", head: true }).eq("passed_screening", true),
        supabase.from("admet_results").select("id", { count: "exact", head: true }).eq("passed_screening", false),
        supabase.from("docking_results").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("docking_results").select("docking_score").order("docking_score", { ascending: true }).limit(1).maybeSingle(),
      ]);

      setStats({
        proteinsCount: proteinsRes.count || 0,
        ligandsCount: ligandsRes.count || 0,
        safeCompounds: admetPassedRes.count || 0,
        failedCompounds: admetFailedRes.count || 0,
        dockingCompleted: dockingRes.count || 0,
        bestBinding: bestDockingRes.data?.docking_score || 0,
      });

      // Fetch top compounds with ADMET data and interaction analysis
      const { data: topResults, error } = await supabase
        .from("docking_results")
        .select(`
          id,
          docking_score,
          binding_affinity,
          rmsd,
          proteins (name, pdb_id),
          ligands (id, name, pubchem_cid, smiles, molecular_formula, molecular_weight)
        `)
        .eq("status", "completed")
        .order("docking_score", { ascending: true })
        .limit(50);

      if (error) throw error;

      // Fetch ADMET scores and interaction data
      const ligandIds = topResults?.map((r: any) => r.ligands?.id).filter(Boolean) || [];
      const dockingIds = topResults?.map((r: any) => r.id) || [];

      const [admetRes, interactionRes] = await Promise.all([
        supabase.from("admet_results").select("*").in("ligand_id", ligandIds),
        supabase.from("final_analysis").select("docking_result_id, interaction_analysis").in("docking_result_id", dockingIds),
      ]);

      const admetMap = new Map(admetRes.data?.map((a) => [a.ligand_id, a]) || []);
      const interactionMap = new Map(interactionRes.data?.map((i) => [i.docking_result_id, i.interaction_analysis]) || []);

      const compounds: TopCompound[] = topResults?.map((result: any) => {
        const admet = admetMap.get(result.ligands?.id);
        const interaction = interactionMap.get(result.id) as any;
        return {
          id: result.id,
          protein_name: result.proteins?.name || "Unknown",
          protein_pdb_id: result.proteins?.pdb_id || "N/A",
          ligand_name: result.ligands?.name || "Unknown",
          ligand_cid: result.ligands?.pubchem_cid || "N/A",
          ligand_smiles: result.ligands?.smiles,
          ligand_formula: result.ligands?.molecular_formula,
          ligand_weight: result.ligands?.molecular_weight,
          docking_score: result.docking_score,
          binding_affinity: result.binding_affinity,
          rmsd: result.rmsd,
          admet_score: admet?.overall_score,
          absorption_score: admet?.absorption_score,
          distribution_score: admet?.distribution_score,
          metabolism_score: admet?.metabolism_score,
          excretion_score: admet?.excretion_score,
          toxicity_score: admet?.toxicity_score,
          passed_admet: admet?.passed_screening,
          interaction_count: interaction?.summary?.total_interactions || 0,
        };
      }) || [];

      setTopCompounds(compounds);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load results data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInteractionDetails = async (compound: TopCompound) => {
    setSelectedCompound(compound);
    setLoadingInteractions(true);
    try {
      const { data } = await supabase
        .from("final_analysis")
        .select("interaction_analysis")
        .eq("docking_result_id", compound.id)
        .maybeSingle();

      setInteractionData(data?.interaction_analysis as InteractionData || null);
    } catch (error) {
      console.error("Error fetching interaction data:", error);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const handleExportJSON = () => {
    const reportData = {
      summary: stats,
      topCompounds: filteredCompounds,
      generatedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(reportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cadd_pipeline_results_${Date.now()}.json`;
    a.click();
    toast({ title: "Export Complete", description: "JSON report exported successfully" });
  };

  const handleExportCSV = () => {
    const headers = [
      "Rank", "Ligand Name", "PubChem CID", "Protein", "PDB ID",
      "Docking Score", "Binding Affinity (kcal/mol)", "RMSD (Å)",
      "ADMET Score", "ADMET Status", "Interactions"
    ];
    
    const rows = filteredCompounds.map((c, i) => [
      i + 1,
      c.ligand_name,
      c.ligand_cid,
      c.protein_name,
      c.protein_pdb_id,
      c.docking_score.toFixed(2),
      c.binding_affinity.toFixed(2),
      c.rmsd.toFixed(2),
      c.admet_score?.toFixed(1) || "N/A",
      c.passed_admet ? "Passed" : "Failed",
      c.interaction_count || 0
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cadd_results_${Date.now()}.csv`;
    a.click();
    toast({ title: "Export Complete", description: "CSV report exported successfully" });
  };

  const bestCompound = topCompounds[0];

  // Chart data
  const topTenChartData = topCompounds.slice(0, 10).map((c, i) => ({
    name: `${i + 1}. ${c.ligand_cid.slice(0, 8)}`,
    score: Math.abs(c.docking_score),
    affinity: Math.abs(c.binding_affinity),
  }));

  const scatterData = topCompounds.slice(0, 50).map((c) => ({
    admet: c.admet_score || 0,
    docking: Math.abs(c.docking_score),
    name: c.ligand_cid,
  }));

  const radarData = bestCompound
    ? [
        { property: "Absorption", value: bestCompound.absorption_score || 0 },
        { property: "Distribution", value: bestCompound.distribution_score || 0 },
        { property: "Metabolism", value: bestCompound.metabolism_score || 0 },
        { property: "Excretion", value: bestCompound.excretion_score || 0 },
        { property: "Toxicity", value: bestCompound.toxicity_score || 0 },
      ]
    : [];

  const admetPieData = [
    { name: "Passed", value: stats.safeCompounds, fill: "hsl(var(--success))" },
    { name: "Failed", value: stats.failedCompounds, fill: "hsl(var(--destructive))" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Results & Analysis</h2>
          <p className="text-muted-foreground">Comprehensive pipeline analysis and visualizations</p>
        </div>
        {topCompounds.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportJSON} className="gap-2">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Proteins</p>
            <p className="text-3xl font-bold text-foreground">{stats.proteinsCount}</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Ligands</p>
            <p className="text-3xl font-bold text-foreground">{stats.ligandsCount.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Docked</p>
            <p className="text-3xl font-bold text-primary">{stats.dockingCompleted}</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" /> ADMET Passed
            </p>
            <p className="text-3xl font-bold text-success">{stats.safeCompounds}</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" /> ADMET Failed
            </p>
            <p className="text-3xl font-bold text-destructive">{stats.failedCompounds}</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Best Score</p>
            <p className="text-3xl font-bold text-primary">{stats.bestBinding.toFixed(2)}</p>
          </div>
        </Card>
      </div>

      {topCompounds.length === 0 ? (
        <Card className="p-12 text-center">
          <Beaker className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Results Yet</h3>
          <p className="text-muted-foreground">
            Complete the pipeline stages to see comprehensive results and analysis
          </p>
        </Card>
      ) : (
        <>
          {/* Best Result Highlight */}
          {bestCompound && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-6 shadow-elevated">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Top Candidate Compound</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {bestCompound.passed_admet ? (
                      <Badge variant="default" className="bg-success">ADMET Passed</Badge>
                    ) : (
                      <Badge variant="destructive">ADMET Failed</Badge>
                    )}
                    <Badge variant="default">Recommended</Badge>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Protein Target</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{bestCompound.protein_pdb_id}</Badge>
                      <span className="font-semibold text-foreground line-clamp-1">{bestCompound.protein_name}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Lead Compound</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">CID: {bestCompound.ligand_cid}</Badge>
                      <span className="font-semibold text-foreground line-clamp-1">{bestCompound.ligand_name}</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">Docking Score</p>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-success" />
                      <p className="text-lg font-bold text-success">{bestCompound.docking_score.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">Binding Affinity</p>
                    <p className="text-lg font-bold text-foreground">{bestCompound.binding_affinity.toFixed(2)} kcal/mol</p>
                  </div>
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">RMSD</p>
                    <p className="text-lg font-bold text-foreground">{bestCompound.rmsd.toFixed(2)} Å</p>
                  </div>
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">ADMET Score</p>
                    <p className="text-lg font-bold text-success">{bestCompound.admet_score?.toFixed(1) || "N/A"}</p>
                  </div>
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">Interactions</p>
                    <p className="text-lg font-bold text-primary">{bestCompound.interaction_count || 0}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => fetchInteractionDetails(bestCompound)} className="w-full gap-2">
                  <Eye className="h-4 w-4" />
                  View Detailed Interaction Analysis
                </Button>
              </div>
            </Card>
          )}

          {/* Main Tabs */}
          <Card className="bg-card shadow-card">
            <Tabs defaultValue="compounds" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="compounds" className="gap-2">
                  <Award className="h-4 w-4" />
                  Compounds
                </TabsTrigger>
                <TabsTrigger value="charts" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="admet" className="gap-2">
                  <Activity className="h-4 w-4" />
                  ADMET Analysis
                </TabsTrigger>
                <TabsTrigger value="report" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </TabsTrigger>
              </TabsList>

              {/* Compounds Tab */}
              <TabsContent value="compounds" className="p-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ligand, protein, CID, or PDB ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterAdmet} onValueChange={(v) => setFilterAdmet(v)}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="ADMET Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Results</SelectItem>
                      <SelectItem value="passed">ADMET Passed</SelectItem>
                      <SelectItem value="failed">ADMET Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                    <SelectTrigger className="w-[160px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docking_score">Docking Score</SelectItem>
                      <SelectItem value="binding_affinity">Binding Affinity</SelectItem>
                      <SelectItem value="admet_score">ADMET Score</SelectItem>
                      <SelectItem value="rmsd">RMSD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Showing {filteredCompounds.length} of {topCompounds.length} compounds
                </p>

                {/* Compound List */}
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {filteredCompounds.map((compound, index) => (
                      <Card 
                        key={compound.id} 
                        className="p-4 hover:shadow-elevated transition-shadow cursor-pointer"
                        onClick={() => fetchInteractionDetails(compound)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={index < 3 ? "default" : "secondary"}>
                                #{topCompounds.findIndex(c => c.id === compound.id) + 1}
                              </Badge>
                              <span className="font-semibold text-foreground">{compound.ligand_name}</span>
                              <Badge variant="outline">CID: {compound.ligand_cid}</Badge>
                              {compound.passed_admet ? (
                                <Badge className="bg-success/10 text-success border-success/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Safe
                                </Badge>
                              ) : compound.passed_admet === false ? (
                                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Flagged
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {compound.protein_name} ({compound.protein_pdb_id})
                            </p>
                            <div className="flex gap-4 text-sm flex-wrap">
                              <div>
                                <span className="text-muted-foreground">Docking: </span>
                                <span className="font-medium text-success">{compound.docking_score.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Affinity: </span>
                                <span className="font-medium">{compound.binding_affinity.toFixed(2)} kcal/mol</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">RMSD: </span>
                                <span className="font-medium">{compound.rmsd.toFixed(2)} Å</span>
                              </div>
                              {compound.admet_score && (
                                <div>
                                  <span className="text-muted-foreground">ADMET: </span>
                                  <span className="font-medium text-success">{compound.admet_score.toFixed(1)}</span>
                                </div>
                              )}
                              {compound.interaction_count > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Interactions: </span>
                                  <span className="font-medium text-primary">{compound.interaction_count}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Charts Tab */}
              <TabsContent value="charts" className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top 10 Binding Scores</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topTenChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis label={{ value: "Absolute Docking Score", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="hsl(var(--primary))" name="Docking Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">ADMET vs Docking Score</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="admet" name="ADMET Score" />
                        <YAxis dataKey="docking" name="Docking Score" />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter data={scatterData} fill="hsl(var(--primary))" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">ADMET Screening Results</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={admetPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {admetPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              {/* ADMET Analysis Tab */}
              <TabsContent value="admet" className="p-6 space-y-6">
                {bestCompound && radarData.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Top Compound ADMET Profile</h3>
                      <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="property" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar
                            name="ADMET Scores"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.6}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">ADMET Score Breakdown</h3>
                      <div className="space-y-4">
                        {[
                          { label: "Absorption", score: bestCompound.absorption_score, color: ADMET_COLORS.absorption },
                          { label: "Distribution", score: bestCompound.distribution_score, color: ADMET_COLORS.distribution },
                          { label: "Metabolism", score: bestCompound.metabolism_score, color: ADMET_COLORS.metabolism },
                          { label: "Excretion", score: bestCompound.excretion_score, color: ADMET_COLORS.excretion },
                          { label: "Toxicity", score: bestCompound.toxicity_score, color: ADMET_COLORS.toxicity },
                        ].map((item) => (
                          <div key={item.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="font-medium">{item.score?.toFixed(1) || "N/A"}</span>
                            </div>
                            <Progress value={item.score || 0} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Card className="bg-muted/50 p-4">
                  <h4 className="font-semibold text-foreground mb-3">ADMET Screening Summary</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 rounded-lg bg-card">
                      <p className="text-3xl font-bold text-success">{stats.safeCompounds}</p>
                      <p className="text-sm text-muted-foreground">Passed All Criteria</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-card">
                      <p className="text-3xl font-bold text-destructive">{stats.failedCompounds}</p>
                      <p className="text-sm text-muted-foreground">Flagged for Concerns</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-card">
                      <p className="text-3xl font-bold text-primary">
                        {stats.safeCompounds + stats.failedCompounds > 0
                          ? ((stats.safeCompounds / (stats.safeCompounds + stats.failedCompounds)) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="report" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Pipeline Summary</h3>
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      This CADD-SBDD pipeline analyzed {stats.proteinsCount} target proteins and screened{" "}
                      {stats.ligandsCount.toLocaleString()} chemical compounds from PubChem. The molecular docking
                      completed {stats.dockingCompleted} protein-ligand pairs, identifying {stats.safeCompounds}{" "}
                      compounds that passed ADMET safety screening.
                    </p>
                    {bestCompound && (
                      <Card className="bg-muted/50 p-4">
                        <h4 className="mb-2 font-semibold text-foreground">Top Candidate</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>{bestCompound.ligand_name}</strong> (CID: {bestCompound.ligand_cid}) showed the strongest
                          binding affinity with <strong>{bestCompound.protein_name}</strong> (PDB: {bestCompound.protein_pdb_id}).
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          <li>Docking score: {bestCompound.docking_score.toFixed(2)} (excellent binding)</li>
                          <li>Binding affinity: {bestCompound.binding_affinity.toFixed(2)} kcal/mol</li>
                          <li>RMSD: {bestCompound.rmsd.toFixed(2)} Å (high confidence pose)</li>
                          {bestCompound.admet_score && (
                            <li>ADMET score: {bestCompound.admet_score.toFixed(1)} ({bestCompound.passed_admet ? "passed" : "failed"} safety criteria)</li>
                          )}
                          {bestCompound.interaction_count > 0 && (
                            <li>Molecular interactions: {bestCompound.interaction_count} (H-bonds, hydrophobic, etc.)</li>
                          )}
                        </ul>
                      </Card>
                    )}
                    <Card className="bg-muted/50 p-4">
                      <h4 className="mb-2 font-semibold text-foreground">Recommendations</h4>
                      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        <li>Review top 10 compounds for experimental validation</li>
                        <li>Consider molecular dynamics simulations for lead optimization</li>
                        <li>Proceed with in vitro binding assays for top candidates</li>
                        <li>Evaluate intellectual property landscape</li>
                        <li>Conduct detailed toxicology studies on lead compounds</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </>
      )}

      {/* Compound Detail Dialog */}
      <Dialog open={!!selectedCompound} onOpenChange={() => setSelectedCompound(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {selectedCompound?.ligand_name} - Detailed Analysis
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            {selectedCompound && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2 text-foreground">Ligand Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {selectedCompound.ligand_name}</p>
                      <p><span className="text-muted-foreground">PubChem CID:</span> {selectedCompound.ligand_cid}</p>
                      {selectedCompound.ligand_formula && (
                        <p><span className="text-muted-foreground">Formula:</span> {selectedCompound.ligand_formula}</p>
                      )}
                      {selectedCompound.ligand_weight && (
                        <p><span className="text-muted-foreground">MW:</span> {selectedCompound.ligand_weight.toFixed(2)} g/mol</p>
                      )}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2 text-foreground">Protein Target</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {selectedCompound.protein_name}</p>
                      <p><span className="text-muted-foreground">PDB ID:</span> {selectedCompound.protein_pdb_id}</p>
                    </div>
                  </Card>
                </div>

                {/* Scores */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-foreground">Binding Metrics</h4>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold text-success">{selectedCompound.docking_score.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Docking Score</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold text-foreground">{selectedCompound.binding_affinity.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Affinity (kcal/mol)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold text-foreground">{selectedCompound.rmsd.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">RMSD (Å)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className={`text-2xl font-bold ${selectedCompound.passed_admet ? 'text-success' : 'text-destructive'}`}>
                        {selectedCompound.admet_score?.toFixed(1) || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">ADMET Score</p>
                    </div>
                  </div>
                </Card>

                {/* Interaction Diagram */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-foreground">2D Interaction Diagram</h4>
                  {loadingInteractions ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <InteractionDiagram2D
                      ligandName={selectedCompound.ligand_name}
                      proteinName={selectedCompound.protein_name}
                      pdbId={selectedCompound.protein_pdb_id}
                      ligandCid={selectedCompound.ligand_cid}
                      bindingAffinity={selectedCompound.binding_affinity}
                      dockingResultId={selectedCompound.id}
                    />
                  )}
                </Card>

                {/* Interaction Summary */}
                {interactionData?.summary && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 text-foreground">Interaction Summary</h4>
                    <div className="grid gap-3 md:grid-cols-5">
                      <div className="text-center p-2 rounded bg-muted">
                        <p className="text-xl font-bold text-primary">{interactionData.summary.hydrogen_bonds}</p>
                        <p className="text-xs text-muted-foreground">H-Bonds</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <p className="text-xl font-bold text-primary">{interactionData.summary.hydrophobic_contacts}</p>
                        <p className="text-xs text-muted-foreground">Hydrophobic</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <p className="text-xl font-bold text-primary">{interactionData.summary.salt_bridges}</p>
                        <p className="text-xs text-muted-foreground">Salt Bridges</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <p className="text-xl font-bold text-primary">{interactionData.summary.pi_stacking}</p>
                        <p className="text-xs text-muted-foreground">π-Stacking</p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted">
                        <p className="text-xl font-bold text-foreground">{interactionData.summary.total_interactions}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                    {interactionData.quality_assessment && (
                      <div className="mt-4 flex gap-2 flex-wrap">
                        <Badge variant="outline">Density: {interactionData.quality_assessment.interaction_density}</Badge>
                        <Badge variant="outline">Mode: {interactionData.quality_assessment.binding_mode}</Badge>
                        <Badge variant="outline">Selectivity: {interactionData.quality_assessment.predicted_selectivity}</Badge>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Next Button */}
      {onNavigate && (
        <div className="flex justify-end pt-4">
          <Button onClick={() => onNavigate("comparison")} className="gap-2">
            Next: Compare Compounds
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;
