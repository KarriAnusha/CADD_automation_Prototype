import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Upload, Download, Dna, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LigandManagement = () => {
  const [librarySize, setLibrarySize] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImportLibrary = () => {
    setIsImporting(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setLibrarySize(progress * 100);
      if (progress >= 100) {
        clearInterval(interval);
        setIsImporting(false);
        toast({
          title: "Import Complete",
          description: "Successfully imported 10,000 ligands from PubChem",
        });
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ligand Library Management</h2>
          <p className="text-muted-foreground">Manage and screen candidate ligands from PubChem database</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Dna className="h-3 w-3" />
          PubChem
        </Badge>
      </div>

      {/* Library Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Ligands</p>
            <p className="text-3xl font-bold text-foreground">{librarySize.toLocaleString()}</p>
            <Badge variant={librarySize >= 10000 ? "default" : "secondary"}>
              {librarySize >= 10000 ? "Target Met" : "In Progress"}
            </Badge>
          </div>
        </Card>

        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Screened</p>
            <p className="text-3xl font-bold text-foreground">0</p>
            <Badge variant="secondary">Pending</Badge>
          </div>
        </Card>

        <Card className="bg-card p-4 shadow-card">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Qualified</p>
            <p className="text-3xl font-bold text-foreground">0</p>
            <Badge variant="secondary">Awaiting ADMET</Badge>
          </div>
        </Card>
      </div>

      {/* Import Actions */}
      <Card className="bg-card p-6 shadow-card">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Import Ligand Library</h3>
          <p className="text-sm text-muted-foreground">
            Import at least 10,000 eligible ligands from PubChem for comprehensive screening
          </p>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Importing ligands...</span>
                <span className="font-medium text-foreground">{Math.round((librarySize / 10000) * 100)}%</span>
              </div>
              <Progress value={(librarySize / 10000) * 100} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleImportLibrary} disabled={isImporting} className="gap-2">
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Import from PubChem
                </>
              )}
            </Button>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Custom Library
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Ligands */}
      <Card className="bg-card p-4 shadow-card">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Search Ligands</h3>
          <div className="flex gap-2">
            <Input placeholder="Search by CID, name, or SMILES..." className="flex-1" />
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="border-l-4 border-l-secondary bg-secondary/5 p-4">
        <h4 className="mb-2 font-semibold text-foreground">About PubChem Integration</h4>
        <p className="text-sm text-muted-foreground">
          PubChem is a database of chemical molecules. The pipeline will extract molecular structures, properties, and
          identifiers for screening. Ligands meeting initial criteria will proceed to ADMET analysis for safety
          assessment.
        </p>
      </Card>
    </div>
  );
};

export default LigandManagement;
