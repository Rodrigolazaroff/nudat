// Escrito a mano a partir de supabase/migrations. Cuando el proyecto esté linkeado
// se reemplaza por: npx supabase gen types typescript --linked > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          rol: Database["public"]["Enums"]["rol"];
          nombre: string;
          nutri_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: {
          nombre?: string;
        };
        Relationships: [];
      };
      invitaciones: {
        Row: {
          id: string;
          nutri_id: string;
          token: string;
          email: string | null;
          nombre: string | null;
          expira_en: string;
          usada_en: string | null;
          paciente_id: string | null;
          created_at: string;
        };
        Insert: {
          email?: string | null;
          nombre?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      comidas: {
        Row: {
          id: string;
          paciente_id: string;
          fecha: string; // YYYY-MM-DD
          hora: string; // HH:MM:SS
          tipo: Database["public"]["Enums"]["tipo_comida"];
          descripcion: string;
          foto_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          fecha: string;
          hora: string;
          tipo: Database["public"]["Enums"]["tipo_comida"];
          descripcion?: string;
          foto_path?: string | null;
        };
        Update: {
          fecha?: string;
          hora?: string;
          tipo?: Database["public"]["Enums"]["tipo_comida"];
          descripcion?: string;
          foto_path?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      ver_invitacion: {
        Args: { p_token: string };
        Returns: {
          nutri_nombre: string;
          email: string | null;
          nombre: string | null;
        }[];
      };
    };
    Enums: {
      rol: "nutri" | "paciente";
      tipo_comida:
        | "desayuno"
        | "media_manana"
        | "almuerzo"
        | "merienda"
        | "cena"
        | "colacion";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];
export type Invitacion = Database["public"]["Tables"]["invitaciones"]["Row"];
export type Comida = Database["public"]["Tables"]["comidas"]["Row"];
export type TipoComida = Database["public"]["Enums"]["tipo_comida"];
export type Rol = Database["public"]["Enums"]["rol"];
