import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProteinSelection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    setIsLoading(true);
    // Placeholder for PDB API integration
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Search Complete",
        description: "Protein data will be fetched from PDB database",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Protein Selection</h2>
          <p className="text-muted-foreground">Search and select target proteins from the PDB database</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Database className="h-3 w-3" />
          PDB Database
        </Badge>
      </div>

      {/* Search Bar */}
      <Card className="bg-card p-4 shadow-card">
        <div className="flex gap-2">
          <Input
            placeholder="Enter PDB ID, protein name, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search PDB
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Example Proteins */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Example Target Proteins</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              id: "1A4R",
              name: "SARS-CoV-2 Main Protease",
              organism: "SARS-CoV-2",
              resolution: "2.16 Å",
            },
            {
              id: "6LU7",
              name: "COVID-19 Main Protease",
              organism: "SARS-CoV-2",
              resolution: "2.16 Å",
            },
            {
              id: "1HTM",
              name: "HIV-1 Protease",
              organism: "Human Immunodeficiency Virus 1",
              resolution: "1.80 Å",
            },
            {
              id: "4HWI",
              name: "Tyrosine Kinase",
              organism: "Homo sapiens",
              resolution: "2.45 Å",
            },
          ].map((protein) => (
            <Card key={protein.id} className="bg-card p-4 shadow-card transition-all hover:shadow-elevated">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{protein.id}</Badge>
                    <span className="text-xs text-muted-foreground">{protein.resolution}</span>
                  </div>
                  <h4 className="font-semibold text-card-foreground">{protein.name}</h4>
                  <p className="text-sm text-muted-foreground">{protein.organism}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-l-4 border-l-info bg-info/5 p-4">
        <h4 className="mb-2 font-semibold text-foreground">About PDB Integration</h4>
        <p className="text-sm text-muted-foreground">
          The Protein Data Bank (PDB) provides structural information about proteins. Select target proteins to begin
          the drug design process. The pipeline will extract 3D coordinates and structural data for docking analysis.
        </p>
      </Card>
    </div>
  );
};

export default ProteinSelection;
