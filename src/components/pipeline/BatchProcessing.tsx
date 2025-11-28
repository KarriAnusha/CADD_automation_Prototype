import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play, Pause, RotateCw, Trash2, Clock, CheckCircle2, XCircle,
  Loader2, Database, Beaker, FlaskConical, AlertTriangle, ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BatchJob {
  id: string;
  job_type: string;
  status: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  batch_size: number;
  input_data: any;
  output_data: any;
  error_log: any;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const JOB_TYPE_ICONS: Record<string, React.ReactNode> = {
  ligand_import: <Database className="h-4 w-4" />,
  admet_screening: <Beaker className="h-4 w-4" />,
  docking_analysis: <FlaskConical className="h-4 w-4" />,
  interaction_analysis: <FlaskConical className="h-4 w-4" />,
};

const JOB_TYPE_LABELS: Record<string, string> = {
  ligand_import: "Ligand Import",
  admet_screening: "ADMET Screening",
  docking_analysis: "Molecular Docking",
  interaction_analysis: "Interaction Analysis",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

interface BatchProcessingProps {
  onNavigate?: (tab: string) => void;
}

const BatchProcessing = ({ onNavigate }: BatchProcessingProps) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newJobType, setNewJobType] = useState<string>("ligand_import");
  const [searchQuery, setSearchQuery] = useState("");
  const [maxCompounds, setMaxCompounds] = useState(1000);
  const [batchSize, setBatchSize] = useState(100);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("batch_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching batch jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBatchJob = async () => {
    setIsCreatingJob(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let inputData: any = { batch_size: batchSize };

      if (newJobType === "ligand_import") {
        if (!searchQuery.trim()) {
          toast({
            title: "Error",
            description: "Please enter a search query for ligand import",
            variant: "destructive",
          });
          return;
        }
        inputData = {
          query: searchQuery,
          max_compounds: maxCompounds,
          batch_size: batchSize,
        };
      }

      // Create the batch job
      const { data: job, error } = await supabase
        .from("batch_jobs")
        .insert({
          user_id: user.id,
          job_type: newJobType,
          status: "pending",
          total_items: newJobType === "ligand_import" ? maxCompounds : 0,
          batch_size: batchSize,
          input_data: inputData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Batch Job Created",
        description: `${JOB_TYPE_LABELS[newJobType]} job queued successfully`,
      });

      // Trigger the job via the agent
      startBatchJob(job.id, newJobType, inputData, user.id);

      setSearchQuery("");
      fetchJobs();
    } catch (error) {
      console.error("Error creating batch job:", error);
      toast({
        title: "Error",
        description: "Failed to create batch job",
        variant: "destructive",
      });
    } finally {
      setIsCreatingJob(false);
    }
  };

  const startBatchJob = async (jobId: string, jobType: string, inputData: any, userId: string) => {
    try {
      // Update job to running
      await supabase
        .from("batch_jobs")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", jobId);

      // Call edge function to process the batch
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("cadd-agent", {
        body: {
          messages: [
            {
              role: "user",
              content: jobType === "ligand_import"
                ? `Use the batch_import_ligands tool with query="${inputData.query}", max_compounds=${inputData.max_compounds}, batch_size=${inputData.batch_size}. This is batch job ${jobId}.`
                : jobType === "admet_screening"
                ? `Use the batch_admet_screening tool with batch_size=${inputData.batch_size}. This is batch job ${jobId}.`
                : `Use the batch_docking tool with batch_size=${inputData.batch_size}. This is batch job ${jobId}.`,
            },
          ],
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      fetchJobs();
    } catch (error) {
      console.error("Error starting batch job:", error);
      await supabase
        .from("batch_jobs")
        .update({ 
          status: "failed", 
          error_log: { error: error instanceof Error ? error.message : "Unknown error" },
          completed_at: new Date().toISOString()
        })
        .eq("id", jobId);
      fetchJobs();
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      await supabase
        .from("batch_jobs")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", jobId);

      toast({ title: "Job Cancelled" });
      fetchJobs();
    } catch (error) {
      console.error("Error cancelling job:", error);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      await supabase.from("batch_jobs").delete().eq("id", jobId);
      toast({ title: "Job Deleted" });
      fetchJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const retryJob = async (job: BatchJob) => {
    try {
      await supabase
        .from("batch_jobs")
        .update({ 
          status: "pending", 
          failed_items: 0,
          error_log: null,
          started_at: null,
          completed_at: null
        })
        .eq("id", job.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        startBatchJob(job.id, job.job_type, job.input_data, user.id);
      }

      toast({ title: "Job Restarted" });
      fetchJobs();
    } catch (error) {
      console.error("Error retrying job:", error);
    }
  };

  const getProgressPercent = (job: BatchJob) => {
    if (job.total_items === 0) return 0;
    return Math.round((job.processed_items / job.total_items) * 100);
  };

  const getElapsedTime = (job: BatchJob) => {
    if (!job.started_at) return "—";
    const start = new Date(job.started_at);
    const end = job.completed_at ? new Date(job.completed_at) : new Date();
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const runningJobs = jobs.filter(j => j.status === "running");
  const pendingJobs = jobs.filter(j => j.status === "pending");
  const completedJobs = jobs.filter(j => j.status === "completed" || j.status === "failed" || j.status === "cancelled");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Batch Processing</h2>
        <p className="text-muted-foreground">Scale to 10,000+ ligands with efficient batch operations</p>
      </div>

      {/* Create New Job */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Create Batch Job</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Job Type</Label>
            <Select value={newJobType} onValueChange={setNewJobType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ligand_import">Ligand Import (PubChem)</SelectItem>
                <SelectItem value="admet_screening">ADMET Screening</SelectItem>
                <SelectItem value="docking_analysis">Molecular Docking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newJobType === "ligand_import" && (
            <>
              <div className="space-y-2">
                <Label>Search Query</Label>
                <Input
                  placeholder="e.g., kinase inhibitor"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Compounds</Label>
                <Select value={maxCompounds.toString()} onValueChange={(v) => setMaxCompounds(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1,000</SelectItem>
                    <SelectItem value="5000">5,000</SelectItem>
                    <SelectItem value="10000">10,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Batch Size</Label>
            <Select value={batchSize.toString()} onValueChange={(v) => setBatchSize(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={createBatchJob} disabled={isCreatingJob} className="w-full gap-2">
              {isCreatingJob ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start Batch Job
            </Button>
          </div>
        </div>
      </Card>

      {/* Running Jobs */}
      {runningJobs.length > 0 && (
        <Card className="p-6 border-primary/20">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Running Jobs ({runningJobs.length})
          </h3>
          <div className="space-y-4">
            {runningJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {JOB_TYPE_ICONS[job.job_type]}
                    <div>
                      <p className="font-medium text-foreground">{JOB_TYPE_LABELS[job.job_type]}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.input_data?.query && `Query: "${job.input_data.query}"`}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => cancelJob(job.id)}>
                    <Pause className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {job.processed_items.toLocaleString()} / {job.total_items.toLocaleString()} items
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {getElapsedTime(job)}
                    </span>
                  </div>
                  <Progress value={getProgressPercent(job)} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{getProgressPercent(job)}% complete</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Jobs */}
      {pendingJobs.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Pending Jobs ({pendingJobs.length})
          </h3>
          <div className="space-y-3">
            {pendingJobs.map((job) => (
              <div key={job.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {JOB_TYPE_ICONS[job.job_type]}
                  <div>
                    <p className="font-medium text-foreground">{JOB_TYPE_LABELS[job.job_type]}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.total_items.toLocaleString()} items • Batch size: {job.batch_size}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => deleteJob(job.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Completed Jobs History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Job History</h3>
        {completedJobs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No completed jobs yet</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {completedJobs.map((job) => (
                <div key={job.id} className="p-4 rounded-lg bg-card border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {JOB_TYPE_ICONS[job.job_type]}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{JOB_TYPE_LABELS[job.job_type]}</p>
                          <Badge className={STATUS_COLORS[job.status]}>
                            {job.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {job.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.processed_items.toLocaleString()} processed
                          {job.failed_items > 0 && ` • ${job.failed_items} failed`}
                          {" • "}{getElapsedTime(job)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {job.status === "failed" && (
                        <Button variant="outline" size="sm" onClick={() => retryJob(job)}>
                          <RotateCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteJob(job.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {job.error_log && (
                    <div className="mt-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {typeof job.error_log === "object" ? JSON.stringify(job.error_log) : job.error_log}
                    </div>
                  )}
                  {job.output_data && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      {job.output_data.message || JSON.stringify(job.output_data)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Jobs</p>
          <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Running</p>
          <p className="text-2xl font-bold text-primary">{runningJobs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-success">
            {jobs.filter(j => j.status === "completed").length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold text-destructive">
            {jobs.filter(j => j.status === "failed").length}
          </p>
        </Card>
      </div>

      {/* Next Button */}
      {onNavigate && (
        <div className="flex justify-end pt-4">
          <Button onClick={() => onNavigate("results")} className="gap-2">
            Next: Results Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default BatchProcessing;
