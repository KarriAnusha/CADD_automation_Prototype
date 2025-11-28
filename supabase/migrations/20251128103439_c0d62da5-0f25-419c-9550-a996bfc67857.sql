-- Create batch_jobs table for tracking large-scale processing
CREATE TABLE public.batch_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('ligand_import', 'admet_screening', 'docking_analysis', 'interaction_analysis')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  batch_size INTEGER NOT NULL DEFAULT 100,
  input_data JSONB,
  output_data JSONB,
  error_log JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own batch jobs"
ON public.batch_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch jobs"
ON public.batch_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch jobs"
ON public.batch_jobs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batch jobs"
ON public.batch_jobs FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_batch_jobs_updated_at
BEFORE UPDATE ON public.batch_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_batch_jobs_user_status ON public.batch_jobs(user_id, status);
CREATE INDEX idx_batch_jobs_created_at ON public.batch_jobs(created_at DESC);