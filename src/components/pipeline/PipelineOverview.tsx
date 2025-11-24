import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, Dna, Shield, Activity, BarChart3, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PipelineOverviewProps {
  onNavigate: (tab: string) => void;
}

const PipelineOverview = ({ onNavigate }: PipelineOverviewProps) => {
  const stages = [
    {
      id: "proteins",
      title: "Protein Selection",
      description: "Extract target protein structures from PDB database",
      icon: Database,
      status: "pending",
      color: "text-primary",
    },
    {
      id: "ligands",
      title: "Ligand Library",
      description: "Collect 10,000+ candidate ligands from PubChem",
      icon: Dna,
      status: "pending",
      color: "text-secondary",
    },
    {
      id: "admet",
      title: "ADMET Screening",
      description: "Screen ligands using ADMETlab 3.0 for safety analysis",
      icon: Shield,
      status: "pending",
      color: "text-accent",
    },
    {
      id: "docking",
      title: "Molecular Docking",
      description: "Dock top ligands against proteins using PyRx",
      icon: Activity,
      status: "pending",
      color: "text-primary",
    },
    {
      id: "results",
      title: "Results & Analysis",
      description: "2D diagram analysis and comprehensive reporting",
      icon: BarChart3,
      status: "pending",
      color: "text-secondary",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Drug Discovery Pipeline</h2>
        <p className="text-lg text-muted-foreground">
          End-to-end structure-based drug design workflow for identifying optimal protein-ligand pairs
        </p>
      </div>

      {/* Key Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Large-Scale Processing</h3>
              <p className="text-sm text-muted-foreground">Handle 10,000+ ligands efficiently</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-secondary bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-secondary/10 p-2">
              <Shield className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Safety First</h3>
              <p className="text-sm text-muted-foreground">Comprehensive ADMET analysis</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-accent bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Detailed Analytics</h3>
              <p className="text-sm text-muted-foreground">Visual 2D diagrams & reports</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-foreground">Pipeline Stages</h3>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <Card key={stage.id} className="bg-card shadow-card transition-shadow hover:shadow-elevated">
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                  <stage.icon className={`h-6 w-6 ${stage.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-card-foreground">{stage.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      Stage {index + 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                </div>
                <Button
                  onClick={() => onNavigate(stage.id)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  Configure
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-6 shadow-elevated">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Getting Started</h3>
          <p className="text-muted-foreground">
            Begin by selecting target proteins from the PDB database. The pipeline will guide you through each stage
            of the drug discovery process, from ligand screening to final analysis.
          </p>
          <Button onClick={() => onNavigate("proteins")} size="lg" className="gap-2">
            Start Pipeline
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PipelineOverview;
