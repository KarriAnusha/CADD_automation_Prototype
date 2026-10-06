# Agentic CADD & Drug Discovery Workflow Platform

An AI-assisted **Computer-Aided Drug Design (CADD)** platform that orchestrates target discovery, multi-source compound retrieval, ADMET screening, protein–ligand scoring, interaction analysis, and compound comparison through a sequential end-to-end workflow.

🔗 **Live Application:** https://cadd.lovable.app

---

## Overview

This platform provides an integrated workflow for exploring early-stage drug discovery tasks from a single interface.

Instead of manually moving data between multiple databases and analysis tools, users can start with a natural-language goal or work through individual pipeline stages.

The system combines:

- Protein structure retrieval
- Multi-database compound discovery
- Molecular property calculation
- Rule-based ADMET screening
- Protein–ligand scoring
- Interaction analysis
- 2D/3D molecular visualization
- Compound ranking and comparison
- LLM-powered tool-calling agent orchestration

### Workflow

```text
Natural-Language Goal / Manual Input
                ↓
        AI Tool-Calling Agent
                ↓
        Protein Target Search
                ↓
       Ligand / Compound Search
                ↓
        Compound Import & Library
                ↓
          ADMET Screening
                ↓
      Protein–Ligand Scoring
                ↓
       Interaction Analysis
                ↓
        2D / 3D Visualization
                ↓
      Result Aggregation & Ranking
                ↓
        Compound Comparison
```

---

## Key Features

### 🧬 Protein Target Discovery

Search and select protein structures using:

- PDB ID
- Keyword-based search
- RCSB Protein Data Bank

For example, users can search for structures such as **6LU7 (SARS-CoV-2 3CLpro)**.

---

### 💊 Multi-Source Compound Discovery

Search and retrieve compounds from multiple sources:

- PubChem
- ChEMBL
- ZINC
- DrugBank
- KEGG
- Kaggle datasets

Retrieved compounds can be imported into a personal ligand library, selected for downstream analysis, and exported as CSV.

The system handles source-specific differences and uses molecular structure information such as SMILES for downstream property calculations where required.

---

### 🧪 ADMET Screening

The platform provides batch-oriented compound screening using established rule-based filters, including:

- Lipinski-style drug-likeness rules
- Veber rules
- PAINS alerts
- Toxicity alerts
- Molecular weight
- LogP
- TPSA
- Hydrogen-bond donors/acceptors

Results are presented as pass/fail classifications together with the underlying property breakdown.

The architecture supports background processing for large compound batches.

---

### 🔬 Protein–Ligand Scoring

The platform calculates reproducible protein–ligand scoring estimates and derives related metrics including:

- Docking-style score
- Binding affinity estimate
- pKd
- pKi
- logKa
- Ligand efficiency
- Drug-likeness indicators

Results can be aggregated by compound and compared across candidates.

> **Important scientific note:** The current implementation does **not** perform physics-based molecular docking or conformational sampling using engines such as AutoDock Vina or GNINA. The current scores are deterministic, ML-inspired computational estimates designed for reproducible ranking and workflow demonstration.

Therefore, these results should **not** be interpreted as experimentally validated binding affinities or publication-grade docking results.

---

## 🤖 Agentic AI Architecture

A server-side LLM tool-calling agent allows users to interact with the workflow using natural language.

For example:

> "Find potential inhibitors for SARS-CoV-2 3CLpro and identify candidates that pass the ADMET filters."

The agent can interpret the request, select appropriate tools, execute multi-step operations, and summarize the resulting data.

### Agent capabilities

The agent can:

- Search protein structures
- Search compound databases
- Import compounds
- Retrieve molecular properties
- Run ADMET analysis
- Run protein–ligand scoring
- Fetch analysis results
- Combine information from multiple pipeline stages
- Summarize results

The application also provides a **direct tool mode** for UI-driven operations where deterministic execution is preferable.

---

## 🔗 Integrated Data Sources

| Source | Purpose |
|---|---|
| RCSB PDB | Protein structure retrieval |
| PubChem PUG REST | Compound and molecular information |
| ChEMBL | Bioactivity and compound information |
| ZINC | Compound discovery |
| DrugBank | Drug/compound information |
| KEGG | Biological and compound information |
| Kaggle | Dataset-based compound sources |

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │   User / Dashboard  │
                    └──────────┬──────────┘
                               │
                    Natural Language / UI
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Tool-Calling Agent │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Protein Tools     Ligand Tools     Analysis Tools
              │                │                │
              ▼                ▼                ▼
          RCSB PDB       PubChem/ChEMBL    ADMET
                          ZINC/DrugBank     Scoring
                          KEGG/Kaggle       Interactions
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                     ┌───────────────────┐
                     │ Database / Results│
                     └─────────┬─────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │ Ranking & Visualization │
                 └─────────────────────────┘
```

---

## 📊 Result Processing

The platform performs result aggregation and normalization across data sources.

Key processing steps include:

- Cross-source deduplication
- Compound-level aggregation
- Best-score selection per protein–ligand pair
- Molecular property normalization
- ADMET result tracking
- Batch job status tracking
- Result comparison

An **ADMET heatmap** provides a visual comparison of selected compounds across relevant molecular properties and screening criteria.

---

## 🧬 Molecular Visualization

The application provides interactive visualization of:

- Protein structures
- Molecular structures
- Protein–ligand interactions
- Residue-level interaction information

The molecular viewer supports rotatable 3D structures and CPK-style atom coloring.

---

## ⚙️ Batch Processing

The architecture is designed for large-scale compound processing.

Batch workflows support:

```text
Compound Collection
       ↓
Background Job Queue
       ↓
Parallel / Batched Processing
       ↓
ADMET Results
       ↓
Scoring Results
       ↓
Aggregation
       ↓
Ranking & Comparison
```

The system is designed with a target scale of **10,000+ ligands** for batch-oriented workflows.

---

## 🔁 Reproducibility

A key design principle of the current scoring implementation is **deterministic reproducibility**.

The same protein–ligand input produces the same scoring result, allowing:

- Repeatable experiments
- Consistent candidate ranking
- Easier debugging
- Transparent comparison between runs

This design intentionally prioritizes reproducibility while leaving room for future integration with validated physics-based docking engines.

---

## 🛡️ Scientific Scope & Limitations

This application is intended as a **computational research and workflow exploration platform**.

### What is real

- Protein data retrieved from live scientific databases
- Compound data retrieved from integrated sources
- Molecular properties calculated from actual molecular structures/SMILES
- Established rule-based ADMET heuristics
- Automated multi-stage data processing
- LLM-based tool orchestration
- Interactive molecular visualization

### What is currently an estimate

The protein–ligand scoring component uses deterministic computational estimates rather than physics-based molecular docking.

Consequently:

- Scores should be interpreted as ranking estimates
- They are not experimentally validated binding affinities
- They should not be used for clinical decisions
- They should not be treated as publication-grade docking results
- Experimental validation would be required for real drug-discovery decisions

A future production/scientific implementation could replace the current scoring component with validated docking engines such as **AutoDock Vina or GNINA**.

---

## 🎯 Example Use Case

A user can begin with a goal such as:

```text
Find potential inhibitors for SARS-CoV-2 3CLpro.
```

The workflow can then:

```text
1. Identify a suitable PDB structure
        ↓
2. Search multiple compound sources
        ↓
3. Import candidate compounds
        ↓
4. Calculate molecular properties
        ↓
5. Apply ADMET filters
        ↓
6. Score protein–ligand pairs
        ↓
7. Analyze interactions
        ↓
8. Rank candidate compounds
        ↓
9. Compare candidates visually
```

This creates a unified computational workflow rather than requiring the user to manually transfer data between separate services.

---

## 🛠️ Technical Focus

The project demonstrates practical work across:

- Agentic AI
- LLM tool calling
- Scientific API integration
- Data normalization
- Batch processing
- PostgreSQL data modeling
- Molecular property computation
- Rule-based ADMET screening
- Computational drug discovery workflows
- Protein–ligand interaction visualization
- 3D molecular visualization
- Full-stack application development
- Reproducible computational workflows

---

## 🚀 Future Improvements

Potential extensions include:

- Integration with AutoDock Vina / GNINA
- Physics-based conformational sampling
- More rigorous binding-energy estimation
- Expanded ADMET models
- Additional compound databases
- Improved agent evaluation and tool-selection metrics
- Persistent experiment tracking
- Larger-scale distributed processing
- Reproducible scientific benchmarking

---

## ⚠️ Disclaimer

This platform is intended for **research, educational, and computational workflow exploration purposes**.

It does not provide medical advice, clinical recommendations, or experimentally validated drug candidates.

Computational rankings and estimates should not be interpreted as evidence of therapeutic efficacy or safety.

---

## 👩‍💻 Project Focus

This project explores how **Agentic AI and software engineering can be combined with computational drug discovery workflows** to make multi-stage scientific analysis more accessible, reproducible, and automatable.
