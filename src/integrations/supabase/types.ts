export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admet_results: {
        Row: {
          absorption_score: number | null
          analysis_data: Json | null
          created_at: string
          distribution_score: number | null
          excretion_score: number | null
          id: string
          ligand_id: string
          metabolism_score: number | null
          overall_score: number | null
          passed_screening: boolean | null
          toxicity_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          absorption_score?: number | null
          analysis_data?: Json | null
          created_at?: string
          distribution_score?: number | null
          excretion_score?: number | null
          id?: string
          ligand_id: string
          metabolism_score?: number | null
          overall_score?: number | null
          passed_screening?: boolean | null
          toxicity_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          absorption_score?: number | null
          analysis_data?: Json | null
          created_at?: string
          distribution_score?: number | null
          excretion_score?: number | null
          id?: string
          ligand_id?: string
          metabolism_score?: number | null
          overall_score?: number | null
          passed_screening?: boolean | null
          toxicity_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admet_results_ligand_id_fkey"
            columns: ["ligand_id"]
            isOneToOne: false
            referencedRelation: "ligands"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_jobs: {
        Row: {
          batch_size: number
          completed_at: string | null
          created_at: string
          error_log: Json | null
          failed_items: number
          id: string
          input_data: Json | null
          job_type: string
          output_data: Json | null
          processed_items: number
          started_at: string | null
          status: string
          total_items: number
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_size?: number
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_items?: number
          id?: string
          input_data?: Json | null
          job_type: string
          output_data?: Json | null
          processed_items?: number
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_size?: number
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_items?: number
          id?: string
          input_data?: Json | null
          job_type?: string
          output_data?: Json | null
          processed_items?: number
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      docking_results: {
        Row: {
          binding_affinity: number | null
          created_at: string
          docking_score: number | null
          id: string
          ligand_id: string
          pose_data: Json | null
          protein_id: string
          rmsd: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          binding_affinity?: number | null
          created_at?: string
          docking_score?: number | null
          id?: string
          ligand_id: string
          pose_data?: Json | null
          protein_id: string
          rmsd?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          binding_affinity?: number | null
          created_at?: string
          docking_score?: number | null
          id?: string
          ligand_id?: string
          pose_data?: Json | null
          protein_id?: string
          rmsd?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "docking_results_ligand_id_fkey"
            columns: ["ligand_id"]
            isOneToOne: false
            referencedRelation: "ligands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docking_results_protein_id_fkey"
            columns: ["protein_id"]
            isOneToOne: false
            referencedRelation: "proteins"
            referencedColumns: ["id"]
          },
        ]
      }
      final_analysis: {
        Row: {
          created_at: string
          diagram_2d_url: string | null
          docking_result_id: string
          id: string
          interaction_analysis: Json | null
          notes: string | null
          recommendations: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagram_2d_url?: string | null
          docking_result_id: string
          id?: string
          interaction_analysis?: Json | null
          notes?: string | null
          recommendations?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagram_2d_url?: string | null
          docking_result_id?: string
          id?: string
          interaction_analysis?: Json | null
          notes?: string | null
          recommendations?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "final_analysis_docking_result_id_fkey"
            columns: ["docking_result_id"]
            isOneToOne: false
            referencedRelation: "docking_results"
            referencedColumns: ["id"]
          },
        ]
      }
      ligands: {
        Row: {
          created_at: string
          id: string
          inchi: string | null
          molecular_formula: string | null
          molecular_weight: number | null
          name: string
          pubchem_cid: string
          selected: boolean | null
          smiles: string | null
          structure_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inchi?: string | null
          molecular_formula?: string | null
          molecular_weight?: number | null
          name: string
          pubchem_cid: string
          selected?: boolean | null
          smiles?: string | null
          structure_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inchi?: string | null
          molecular_formula?: string | null
          molecular_weight?: number | null
          name?: string
          pubchem_cid?: string
          selected?: boolean | null
          smiles?: string | null
          structure_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proteins: {
        Row: {
          created_at: string
          description: string | null
          id: string
          method: string | null
          name: string
          organism: string | null
          pdb_id: string
          resolution: number | null
          selected: boolean | null
          structure_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          method?: string | null
          name: string
          organism?: string | null
          pdb_id: string
          resolution?: number | null
          selected?: boolean | null
          structure_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          method?: string | null
          name?: string
          organism?: string | null
          pdb_id?: string
          resolution?: number | null
          selected?: boolean | null
          structure_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
