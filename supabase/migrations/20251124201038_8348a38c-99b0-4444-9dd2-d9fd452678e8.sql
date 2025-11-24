-- Create proteins table for PDB data
CREATE TABLE public.proteins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pdb_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  organism TEXT,
  resolution DECIMAL,
  method TEXT,
  structure_data JSONB,
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ligands table for PubChem data (must support 10,000+ ligands)
CREATE TABLE public.ligands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pubchem_cid TEXT NOT NULL,
  name TEXT NOT NULL,
  molecular_formula TEXT,
  molecular_weight DECIMAL,
  smiles TEXT,
  inchi TEXT,
  structure_data JSONB,
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ADMET screening results table
CREATE TABLE public.admet_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ligand_id UUID NOT NULL REFERENCES public.ligands(id) ON DELETE CASCADE,
  absorption_score DECIMAL,
  distribution_score DECIMAL,
  metabolism_score DECIMAL,
  excretion_score DECIMAL,
  toxicity_score DECIMAL,
  overall_score DECIMAL,
  passed_screening BOOLEAN DEFAULT false,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create docking results table
CREATE TABLE public.docking_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  protein_id UUID NOT NULL REFERENCES public.proteins(id) ON DELETE CASCADE,
  ligand_id UUID NOT NULL REFERENCES public.ligands(id) ON DELETE CASCADE,
  binding_affinity DECIMAL,
  docking_score DECIMAL,
  rmsd DECIMAL,
  pose_data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create final analysis table
CREATE TABLE public.final_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  docking_result_id UUID NOT NULL REFERENCES public.docking_results(id) ON DELETE CASCADE,
  diagram_2d_url TEXT,
  interaction_analysis JSONB,
  recommendations TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.proteins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ligands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admet_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docking_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for proteins
CREATE POLICY "Users can view their own proteins"
  ON public.proteins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own proteins"
  ON public.proteins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proteins"
  ON public.proteins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proteins"
  ON public.proteins FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for ligands
CREATE POLICY "Users can view their own ligands"
  ON public.ligands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ligands"
  ON public.ligands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ligands"
  ON public.ligands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ligands"
  ON public.ligands FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for ADMET results
CREATE POLICY "Users can view their own ADMET results"
  ON public.admet_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ADMET results"
  ON public.admet_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ADMET results"
  ON public.admet_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ADMET results"
  ON public.admet_results FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for docking results
CREATE POLICY "Users can view their own docking results"
  ON public.docking_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own docking results"
  ON public.docking_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own docking results"
  ON public.docking_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own docking results"
  ON public.docking_results FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for final analysis
CREATE POLICY "Users can view their own final analysis"
  ON public.final_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own final analysis"
  ON public.final_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own final analysis"
  ON public.final_analysis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own final analysis"
  ON public.final_analysis FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_proteins_user_id ON public.proteins(user_id);
CREATE INDEX idx_proteins_pdb_id ON public.proteins(pdb_id);
CREATE INDEX idx_ligands_user_id ON public.ligands(user_id);
CREATE INDEX idx_ligands_pubchem_cid ON public.ligands(pubchem_cid);
CREATE INDEX idx_admet_results_user_id ON public.admet_results(user_id);
CREATE INDEX idx_admet_results_ligand_id ON public.admet_results(ligand_id);
CREATE INDEX idx_docking_results_user_id ON public.docking_results(user_id);
CREATE INDEX idx_docking_results_protein_ligand ON public.docking_results(protein_id, ligand_id);
CREATE INDEX idx_final_analysis_user_id ON public.final_analysis(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_proteins_updated_at
  BEFORE UPDATE ON public.proteins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ligands_updated_at
  BEFORE UPDATE ON public.ligands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admet_results_updated_at
  BEFORE UPDATE ON public.admet_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_docking_results_updated_at
  BEFORE UPDATE ON public.docking_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_final_analysis_updated_at
  BEFORE UPDATE ON public.final_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();