import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, BarChart3, Image, Upload } from "lucide-react";

const ResultsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Results & Analysis</h2>
          <p className="text-muted-foreground">Comprehensive analysis and 2D molecular diagrams</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Proteins Analyzed</p>
            <p className="text-3xl font-bold text-foreground">4</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Ligands Screened</p>
            <p className="text-3xl font-bold text-foreground">10,000</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Safe Compounds</p>
            <p className="text-3xl font-bold text-success">156</p>
          </div>
        </Card>
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Best Binding</p>
            <p className="text-3xl font-bold text-primary">-8.5</p>
          </div>
        </Card>
      </div>

      {/* Best Result Highlight */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-6 shadow-elevated">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">Best Protein-Ligand Pair</h3>
            <Badge variant="default" className="text-base">
              Recommended
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Protein</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">1A4R</Badge>
                <span className="font-semibold text-foreground">SARS-CoV-2 Main Protease</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ligand</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">CID12345</Badge>
                <span className="font-semibold text-foreground">Candidate Compound A</span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-card p-3">
              <p className="text-xs text-muted-foreground">Binding Score</p>
              <p className="text-lg font-bold text-primary">-8.5</p>
            </div>
            <div className="rounded-lg bg-card p-3">
              <p className="text-xs text-muted-foreground">Binding Energy</p>
              <p className="text-lg font-bold text-foreground">-45.2 kcal/mol</p>
            </div>
            <div className="rounded-lg bg-card p-3">
              <p className="text-xs text-muted-foreground">RMSD</p>
              <p className="text-lg font-bold text-foreground">1.2 Å</p>
            </div>
            <div className="rounded-lg bg-card p-3">
              <p className="text-xs text-muted-foreground">ADMET Score</p>
              <p className="text-lg font-bold text-success">9.2/10</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Card className="bg-card shadow-card">
        <Tabs defaultValue="diagram" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagram" className="gap-2">
              <Image className="h-4 w-4" />
              2D Diagram
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-2">
              <FileText className="h-4 w-4" />
              Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">2D Molecular Interaction Diagram</h3>
              <Card className="flex aspect-video items-center justify-center bg-muted/50">
                <div className="text-center">
                  <Image className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    2D diagram from Discovery Studio will be displayed here
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Diagram
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Binding Analysis</h3>
              <div className="space-y-3">
                <Card className="bg-muted/50 p-4">
                  <h4 className="mb-2 font-semibold text-foreground">Hydrogen Bonds</h4>
                  <p className="text-sm text-muted-foreground">
                    3 key hydrogen bonds identified with residues GLU166, HIS41, and CYS145
                  </p>
                </Card>
                <Card className="bg-muted/50 p-4">
                  <h4 className="mb-2 font-semibold text-foreground">Hydrophobic Interactions</h4>
                  <p className="text-sm text-muted-foreground">
                    Strong hydrophobic interactions with MET49, MET165, and PRO168
                  </p>
                </Card>
                <Card className="bg-muted/50 p-4">
                  <h4 className="mb-2 font-semibold text-foreground">Van der Waals Forces</h4>
                  <p className="text-sm text-muted-foreground">
                    Multiple Van der Waals contacts stabilizing the binding pose
                  </p>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="report" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Executive Summary</h3>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  This CADD-SBDD pipeline analysis identified compound CID12345 as the most promising drug candidate
                  against SARS-CoV-2 Main Protease (PDB: 1A4R).
                </p>
                <Card className="bg-muted/50 p-4">
                  <h4 className="mb-2 font-semibold text-foreground">Key Findings</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Exceptional binding affinity with score of -8.5</li>
                    <li>Passed all ADMET safety criteria</li>
                    <li>Strong hydrogen bonding network with active site</li>
                    <li>Favorable pharmacokinetic properties predicted</li>
                  </ul>
                </Card>
                <Card className="bg-muted/50 p-4">
                  <h4 className="mb-2 font-semibold text-foreground">Recommendations</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Proceed to in vitro validation studies</li>
                    <li>Synthesize compound for experimental testing</li>
                    <li>Conduct detailed pharmacological profiling</li>
                  </ul>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ResultsDashboard;
