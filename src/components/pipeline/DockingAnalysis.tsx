import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, PlayCircle, Download, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DockingAnalysis = () => {
  const mockResults = [
    { protein: "1A4R", ligand: "CID12345", score: -8.5, energy: -45.2, rmsd: 1.2, rank: 1 },
    { protein: "1A4R", ligand: "CID67890", score: -8.2, energy: -43.8, rmsd: 1.5, rank: 2 },
    { protein: "6LU7", ligand: "CID11111", score: -7.9, energy: -42.1, rmsd: 1.8, rank: 3 },
  ];

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
                <p className="text-2xl font-bold text-foreground">4</p>
                <p className="text-xs text-muted-foreground">Target structures from PDB</p>
              </div>
            </Card>
            <Card className="bg-muted/50 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Safe Ligands</p>
                <p className="text-2xl font-bold text-foreground">0</p>
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
            <Badge>Ready</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload PyRx docking results or start automated docking for protein-ligand pairs
          </p>
          <div className="flex gap-2">
            <Button className="flex-1 gap-2">
              <PlayCircle className="h-4 w-4" />
              Start Docking
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Upload className="h-4 w-4" />
              Upload Results
            </Button>
          </div>
        </div>
      </Card>

      {/* Top Results */}
      <Card className="bg-card shadow-card">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Top Docking Results</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Protein</TableHead>
                  <TableHead>Ligand</TableHead>
                  <TableHead>Binding Score</TableHead>
                  <TableHead>Energy (kcal/mol)</TableHead>
                  <TableHead>RMSD (Å)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockResults.length > 0 ? (
                  mockResults.map((result) => (
                    <TableRow key={`${result.protein}-${result.ligand}`}>
                      <TableCell>
                        <Badge variant="secondary">#{result.rank}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{result.protein}</TableCell>
                      <TableCell className="font-medium">{result.ligand}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">{result.score}</span>
                      </TableCell>
                      <TableCell>{result.energy}</TableCell>
                      <TableCell>{result.rmsd}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No docking results available. Run docking analysis to see results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
