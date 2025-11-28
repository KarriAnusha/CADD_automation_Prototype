import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Activity, Database, Shield, Dna, BarChart3, GitCompare, Sparkles, Atom, Layers } from "lucide-react";
import PipelineOverview from "@/components/pipeline/PipelineOverview";
import ProteinSelection from "@/components/pipeline/ProteinSelection";
import LigandManagement from "@/components/pipeline/LigandManagement";
import ADMETScreening from "@/components/pipeline/ADMETScreening";
import DockingAnalysis from "@/components/pipeline/DockingAnalysis";
import ResultsDashboard from "@/components/pipeline/ResultsDashboard";
import { CompoundComparison } from "@/components/pipeline/CompoundComparison";
import { AgentChat } from "@/components/agent/AgentChat";
import InteractionDiagrams from "@/components/pipeline/InteractionDiagrams";
import BatchProcessing from "@/components/pipeline/BatchProcessing";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Dna className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">CADD-SBDD Pipeline</h1>
              <p className="text-sm text-muted-foreground">Computer Aided Drug Design - Structure Based Drug Design</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card className="shadow-elevated">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full overflow-x-auto gap-1 bg-muted p-2">
              <TabsTrigger value="agent" className="flex items-center gap-1.5 bg-gradient-to-r from-primary/20 to-secondary/20 text-xs">
                <Sparkles className="h-4 w-4" />
                <span className="hidden lg:inline">AI Agent</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
                <Activity className="h-4 w-4" />
                <span className="hidden lg:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="proteins" className="flex items-center gap-1.5 text-xs">
                <Database className="h-4 w-4" />
                <span className="hidden lg:inline">Proteins</span>
              </TabsTrigger>
              <TabsTrigger value="ligands" className="flex items-center gap-1.5 text-xs">
                <Dna className="h-4 w-4" />
                <span className="hidden lg:inline">Ligands</span>
              </TabsTrigger>
              <TabsTrigger value="admet" className="flex items-center gap-1.5 text-xs">
                <Shield className="h-4 w-4" />
                <span className="hidden lg:inline">ADMET</span>
              </TabsTrigger>
              <TabsTrigger value="docking" className="flex items-center gap-1.5 text-xs">
                <Activity className="h-4 w-4" />
                <span className="hidden lg:inline">Docking</span>
              </TabsTrigger>
              <TabsTrigger value="diagrams" className="flex items-center gap-1.5 text-xs">
                <Atom className="h-4 w-4" />
                <span className="hidden lg:inline">2D Diagrams</span>
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-1.5 text-xs">
                <Layers className="h-4 w-4" />
                <span className="hidden lg:inline">Batch</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-1.5 text-xs">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden lg:inline">Results</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-1.5 text-xs">
                <GitCompare className="h-4 w-4" />
                <span className="hidden lg:inline">Compare</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="agent" className="mt-0">
                <AgentChat onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="overview" className="mt-0">
                <PipelineOverview onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="proteins" className="mt-0">
                <ProteinSelection onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="ligands" className="mt-0">
                <LigandManagement onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="admet" className="mt-0">
                <ADMETScreening onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="docking" className="mt-0">
                <DockingAnalysis onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="diagrams" className="mt-0">
                <InteractionDiagrams onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="batch" className="mt-0">
                <BatchProcessing onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="results" className="mt-0">
                <ResultsDashboard onNavigate={setActiveTab} />
              </TabsContent>

              <TabsContent value="comparison" className="mt-0">
                <CompoundComparison />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Index;
