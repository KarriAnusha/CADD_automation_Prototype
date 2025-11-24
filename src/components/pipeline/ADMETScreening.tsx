import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const ADMETScreening = () => {
  const admetCriteria = [
    { id: "absorption", label: "Absorption", description: "Intestinal absorption prediction", enabled: true },
    { id: "distribution", label: "Distribution", description: "Blood-brain barrier penetration", enabled: true },
    { id: "metabolism", label: "Metabolism", description: "CYP450 enzyme interaction", enabled: true },
    { id: "excretion", label: "Excretion", description: "Clearance and half-life", enabled: true },
    { id: "toxicity", label: "Toxicity", description: "Hepatotoxicity and cardiotoxicity", enabled: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ADMET Screening</h2>
          <p className="text-muted-foreground">Screen ligands for safety and drug-likeness using ADMETlab 3.0</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-3 w-3" />
          ADMETlab 3.0
        </Badge>
      </div>

      {/* Screening Progress */}
      <Card className="bg-gradient-to-br from-accent/10 to-secondary/10 p-6 shadow-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Screening Status</h3>
            <Badge>Not Started</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ligands Analyzed</span>
              <span className="font-medium text-foreground">0 / 10,000</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
          <Button className="w-full gap-2">
            <PlayCircle className="h-4 w-4" />
            Start ADMET Screening
          </Button>
        </div>
      </Card>

      {/* Screening Criteria */}
      <Card className="bg-card p-6 shadow-card">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Screening Criteria</h3>
          <p className="text-sm text-muted-foreground">
            Select ADMET properties to evaluate. All criteria are recommended for comprehensive safety analysis.
          </p>
          <div className="space-y-3">
            {admetCriteria.map((criterion) => (
              <Card key={criterion.id} className="bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox id={criterion.id} defaultChecked={criterion.enabled} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={criterion.id}
                      className="cursor-pointer font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {criterion.label}
                    </label>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-success bg-card p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm font-medium text-muted-foreground">Safe Ligands</p>
            </div>
            <p className="text-3xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Passed all criteria</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-warning bg-card p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="text-sm font-medium text-muted-foreground">Warning</p>
            </div>
            <p className="text-3xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Minor concerns</p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-destructive bg-card p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-muted-foreground">Failed</p>
            </div>
            <p className="text-3xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Rejected ligands</p>
          </div>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-l-4 border-l-accent bg-accent/5 p-4">
        <h4 className="mb-2 font-semibold text-foreground">About ADMET Screening</h4>
        <p className="text-sm text-muted-foreground">
          ADMET (Absorption, Distribution, Metabolism, Excretion, Toxicity) screening predicts drug-like properties and
          safety profiles. ADMETlab 3.0 uses machine learning models to evaluate these properties before costly
          experimental testing.
        </p>
      </Card>
    </div>
  );
};

export default ADMETScreening;
