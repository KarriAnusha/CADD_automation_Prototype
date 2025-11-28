import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, Database, Check, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Protein {
  id?: string;
  pdb_id: string;
  name: string;
  organism: string;
  resolution: number;
  description?: string;
  method?: string;
  selected: boolean;
}

interface ProteinSelectionProps {
  onNavigate?: (tab: string) => void;
}

const ProteinSelection = ({ onNavigate }: ProteinSelectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Protein[]>([]);
  const [savedProteins, setSavedProteins] = useState<Protein[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedProteins();
  }, []);

  const fetchSavedProteins = async () => {
    const { data, error } = await supabase
      .from("proteins")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load saved proteins",
        variant: "destructive",
      });
      return;
    }

    setSavedProteins(data || []);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a search term",
        description: "Please enter a PDB ID, protein name, or keyword",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Route through edge function to avoid CORS issues
      const { data, error } = await supabase.functions.invoke('cadd-agent', {
        body: {
          message: `Search PDB for protein: ${searchQuery}`,
          directTool: {
            name: 'search_proteins',
            args: { query: searchQuery, limit: 10 }
          }
        }
      });

      if (error) throw error;

      // Parse the response to extract protein results
      const responseText = data?.response || '';
      const toolResults = data?.toolResults || [];
      
      // Find the search results from tool execution
      let proteins: Protein[] = [];
      
      for (const result of toolResults) {
        if (result.results && Array.isArray(result.results)) {
          proteins = result.results.map((p: any) => ({
            pdb_id: p.pdb_id,
            name: p.name || p.title || "Unknown",
            organism: p.organism || "Unknown",
            resolution: p.resolution || 0,
            method: p.method || "Unknown",
            description: p.description || "",
            selected: false,
          }));
          break;
        }
      }

      if (proteins.length === 0) {
        setSearchResults([]);
        toast({
          title: "No results found",
          description: "Try a different search term",
        });
        setIsLoading(false);
        return;
      }

      setSearchResults(proteins);
      toast({
        title: "Search Complete",
        description: `Found ${proteins.length} proteins`,
      });
    } catch (error) {
      console.error('PDB search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to fetch protein data from PDB",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProtein = async (protein: Protein) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add proteins",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("proteins").insert({
      user_id: user.id,
      pdb_id: protein.pdb_id,
      name: protein.name,
      organism: protein.organism,
      resolution: protein.resolution,
      method: protein.method,
      description: protein.description,
      selected: false,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add protein",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Protein Added",
      description: `${protein.name} has been added to your library`,
    });

    fetchSavedProteins();
    setSearchResults(searchResults.filter((p) => p.pdb_id !== protein.pdb_id));
  };

  const handleToggleSelect = async (proteinId: string, currentSelected: boolean) => {
    const { error } = await supabase
      .from("proteins")
      .update({ selected: !currentSelected })
      .eq("id", proteinId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update protein selection",
        variant: "destructive",
      });
      return;
    }

    fetchSavedProteins();
  };

  const handleDeleteProtein = async (proteinId: string) => {
    const { error } = await supabase.from("proteins").delete().eq("id", proteinId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete protein",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Protein Deleted",
      description: "Protein has been removed from your library",
    });

    fetchSavedProteins();
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
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Search Results</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {searchResults.map((protein) => (
              <Card key={protein.pdb_id} className="bg-card p-4 shadow-card transition-all hover:shadow-elevated">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{protein.pdb_id}</Badge>
                      <span className="text-xs text-muted-foreground">{protein.resolution.toFixed(2)} Å</span>
                    </div>
                    <h4 className="font-semibold text-card-foreground">{protein.name}</h4>
                    <p className="text-sm text-muted-foreground">{protein.organism}</p>
                    {protein.method && (
                      <p className="text-xs text-muted-foreground">Method: {protein.method}</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => handleAddProtein(protein)}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Saved Proteins */}
      {savedProteins.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Your Protein Library ({savedProteins.length})</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {savedProteins.map((protein) => (
              <Card
                key={protein.id}
                className={`bg-card p-4 shadow-card transition-all hover:shadow-elevated ${
                  protein.selected ? "border-2 border-primary" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{protein.pdb_id}</Badge>
                      <span className="text-xs text-muted-foreground">{protein.resolution.toFixed(2)} Å</span>
                      {protein.selected && (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Selected
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-card-foreground">{protein.name}</h4>
                    <p className="text-sm text-muted-foreground">{protein.organism}</p>
                    {protein.method && (
                      <p className="text-xs text-muted-foreground">Method: {protein.method}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={protein.selected ? "default" : "outline"}
                      onClick={() => handleToggleSelect(protein.id!, protein.selected)}
                    >
                      {protein.selected ? "Deselect" : "Select"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProtein(protein.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card className="border-l-4 border-l-info bg-info/5 p-4">
        <h4 className="mb-2 font-semibold text-foreground">About PDB Integration</h4>
        <p className="text-sm text-muted-foreground">
          The Protein Data Bank (PDB) provides structural information about proteins. Select target proteins to begin
          the drug design process. The pipeline will extract 3D coordinates and structural data for docking analysis.
        </p>
      </Card>

      {/* Next Button */}
      {onNavigate && (
        <div className="flex justify-end pt-4">
          <Button onClick={() => onNavigate("ligands")} className="gap-2">
            Next: Ligands
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProteinSelection;
