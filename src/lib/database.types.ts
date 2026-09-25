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
          nombre: string;
          created_at: string;
        };
        Insert: never;
        Update: {
          nombre?: string;
        };
        Relationships: [];
      };
      comidas: {
        Row: {
          id: string;
          usuario_id: string;
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
    Functions: { [_ in never]: never };
    Enums: {
      tipo_comida:
        | "desayuno"
        | "media_manana"
        | "almuerzo"
        | "merienda"
        | "cena"
        | "colacion"
        | "bebida";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];
export type Comida = Database["public"]["Tables"]["comidas"]["Row"];
export type TipoComida = Database["public"]["Enums"]["tipo_comida"];
