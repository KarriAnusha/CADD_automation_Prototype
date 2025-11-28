-- Add unique constraint on ligands for batch import upsert
ALTER TABLE public.ligands 
ADD CONSTRAINT ligands_user_pubchem_unique UNIQUE (user_id, pubchem_cid);