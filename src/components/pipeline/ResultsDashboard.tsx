import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, BarChart3, TrendingDown, Award, Beaker } from "lucide-react";
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
} from "recharts";

interface TopCompound {
  id: string;
  protein_name: string;
  protein_pdb_id: string;
  ligand_name: string;
  ligand_cid: string;
  docking_score: number;
  binding_affinity: number;
  rmsd: number;
  admet_score?: number;
  absorption_score?: number;
  distribution_score?: number;
  metabolism_score?: number;
  excretion_score?: number;
  toxicity_score?: number;
}

const ResultsDashboard = () => {
  const [stats, setStats] = useState({
    proteinsCount: 0,
    ligandsCount: 0,
    safeCompounds: 0,
    bestBinding: 0,
  });
  const [topCompounds, setTopCompounds] = useState<TopCompound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch statistics
      const [proteinsRes, ligandsRes, admetRes, dockingRes] = await Promise.all([
        supabase.from("proteins").select("id", { count: "exact", head: true }),
        supabase.from("ligands").select("id", { count: "exact", head: true }),
        supabase.from("admet_results").select("id", { count: "exact", head: true }).eq("passed_screening", true),
        supabase
          .from("docking_results")
          .select("docking_score")
          .order("docking_score", { ascending: true })
          .limit(1)
          .single(),
      ]);

      setStats({
        proteinsCount: proteinsRes.count || 0,
        ligandsCount: ligandsRes.count || 0,
        safeCompounds: admetRes.count || 0,
        bestBinding: dockingRes.data?.docking_score || 0,
      });

      // Fetch top compounds with ADMET data
      const { data: topResults, error } = await supabase
        .from("docking_results")
        .select(
          `
          id,
          docking_score,
          binding_affinity,
          rmsd,
          proteins (
            name,
            pdb_id
          ),
          ligands (
            name,
            pubchem_cid,
            id
          )
        `
        )
        .eq("status", "completed")
        .order("docking_score", { ascending: true })
        .limit(20);

      if (error) throw error;

      // Fetch ADMET scores for these ligands
      const ligandIds = topResults?.map((r: any) => r.ligands.id).filter(Boolean) || [];
      const { data: admetData } = await supabase
        .from("admet_results")
        .select("*")
        .in("ligand_id", ligandIds);

      const admetMap = new Map(admetData?.map((a) => [a.ligand_id, a]) || []);

      const compounds: TopCompound[] =
        topResults?.map((result: any) => {
          const admet = admetMap.get(result.ligands.id);
          return {
            id: result.id,
            protein_name: result.proteins?.name || "Unknown",
            protein_pdb_id: result.proteins?.pdb_id || "N/A",
            ligand_name: result.ligands?.name || "Unknown",
            ligand_cid: result.ligands?.pubchem_cid || "N/A",
            docking_score: result.docking_score,
            binding_affinity: result.binding_affinity,
            rmsd: result.rmsd,
            admet_score: admet?.overall_score,
            absorption_score: admet?.absorption_score,
            distribution_score: admet?.distribution_score,
            metabolism_score: admet?.metabolism_score,
            excretion_score: admet?.excretion_score,
            toxicity_score: admet?.toxicity_score,
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

  const handleExportReport = () => {
    const reportData = {
      summary: stats,
      topCompounds: topCompounds.slice(0, 10),
      generatedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(reportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cadd_pipeline_results_${Date.now()}.json`;
    a.click();

    toast({
      title: "Export Complete",
      description: "Results exported successfully",
    });
  };

  const bestCompound = topCompounds[0];

  // Prepare chart data
  const topTenChartData = topCompounds.slice(0, 10).map((c, i) => ({
    name: `${i + 1}. ${c.ligand_cid}`,
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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Results & Analysis</h2>
          <p className="text-muted-foreground">Comprehensive pipeline analysis and visualizations</p>
        </div>
        {topCompounds.length > 0 && (
          <Button onClick={handleExportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Proteins Analyzed</p>
            <p className="text-3xl font-bold text-foreground">{stats.proteinsCount}</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Ligands Screened</p>
            <p className="text-3xl font-bold text-foreground">{stats.ligandsCount.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Safe Compounds</p>
            <p className="text-3xl font-bold text-success">{stats.safeCompounds}</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Best Binding</p>
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
                  <Badge variant="default" className="text-base">
                    Recommended
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Protein</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{bestCompound.protein_pdb_id}</Badge>
                      <span className="font-semibold text-foreground line-clamp-1">
                        {bestCompound.protein_name}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Ligand</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">CID: {bestCompound.ligand_cid}</Badge>
                      <span className="font-semibold text-foreground line-clamp-1">
                        {bestCompound.ligand_name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">Docking Score</p>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-success" />
                      <p className="text-lg font-bold text-success">{bestCompound.docking_score.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">Binding Affinity</p>
                    <p className="text-lg font-bold text-foreground">
                      {bestCompound.binding_affinity.toFixed(2)} kcal/mol
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">RMSD</p>
                    <p className="text-lg font-bold text-foreground">{bestCompound.rmsd.toFixed(2)} Å</p>
                  </div>
                  <div className="rounded-lg bg-card p-3">
                    <p className="text-xs text-muted-foreground">ADMET Score</p>
                    <p className="text-lg font-bold text-success">
                      {bestCompound.admet_score?.toFixed(1) || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Interactive Visualizations */}
          <Card className="bg-card shadow-card">
            <Tabs defaultValue="charts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="charts" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="compounds" className="gap-2">
                  <Award className="h-4 w-4" />
                  Top Compounds
                </TabsTrigger>
                <TabsTrigger value="report" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </TabsTrigger>
              </TabsList>

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
                        <XAxis
                          dataKey="admet"
                          name="ADMET Score"
                          label={{ value: "ADMET Score", position: "insideBottom", offset: -5 }}
                        />
                        <YAxis
                          dataKey="docking"
                          name="Docking Score"
                          label={{ value: "Docking Score", angle: -90, position: "insideLeft" }}
                        />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter data={scatterData} fill="hsl(var(--primary))" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  {bestCompound && radarData.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Top Compound ADMET Profile
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
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
                  )}
                </div>
              </TabsContent>

              <TabsContent value="compounds" className="p-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Top 20 Compounds</h3>
                  {topCompounds.slice(0, 20).map((compound, index) => (
                    <Card key={compound.id} className="p-4 hover:shadow-elevated transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                            <span className="font-semibold text-foreground">{compound.ligand_name}</span>
                            <Badge variant="outline">CID: {compound.ligand_cid}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {compound.protein_name} ({compound.protein_pdb_id})
                          </p>
                          <div className="flex gap-4 text-sm">
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
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="report" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Pipeline Summary</h3>
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      This CADD-SBDD pipeline successfully analyzed {stats.proteinsCount} target proteins and screened{" "}
                      {stats.ligandsCount.toLocaleString()} chemical compounds from PubChem. The analysis identified{" "}
                      {stats.safeCompounds} compounds that passed ADMET safety screening.
                    </p>
                    {bestCompound && (
                      <Card className="bg-muted/50 p-4">
                        <h4 className="mb-2 font-semibold text-foreground">Top Candidate</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {bestCompound.ligand_name} (CID: {bestCompound.ligand_cid}) showed the strongest binding
                          affinity with {bestCompound.protein_name} (PDB: {bestCompound.protein_pdb_id}).
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          <li>Docking score: {bestCompound.docking_score.toFixed(2)} (excellent binding)</li>
                          <li>Binding affinity: {bestCompound.binding_affinity.toFixed(2)} kcal/mol</li>
                          <li>RMSD: {bestCompound.rmsd.toFixed(2)} Å (high confidence pose)</li>
                          {bestCompound.admet_score && (
                            <li>ADMET score: {bestCompound.admet_score.toFixed(1)} (passed safety criteria)</li>
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
                      </ul>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
};

export default ResultsDashboard;
