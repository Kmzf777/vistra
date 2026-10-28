
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "bloqueios": {
                  Row: {
                    "criado_em": string,"criado_por": string | null,"google_place_id": string | null,"id": number,"lead_id": string | null,"motivo": string,"origem": string | null,"telefone_e164": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"criado_por"?: string | null,"google_place_id"?: string | null,"id"?: never,"lead_id"?: string | null,"motivo": string,"origem"?: string | null,"telefone_e164"?: string | null
                  }
                  Update: {
                    "criado_em"?: string,"criado_por"?: string | null,"google_place_id"?: string | null,"id"?: never,"lead_id"?: string | null,"motivo"?: string,"origem"?: string | null,"telefone_e164"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "bloqueios_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bloqueios_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"cidades": {
                  Row: {
                    "ativa": boolean,"id": string,"nome": string,"uf": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativa"?: boolean,"id"?: string,"nome": string,"uf": string
                  }
                  Update: {
                    "ativa"?: boolean,"id"?: string,"nome"?: string,"uf"?: string
                  }
                  Relationships: [
                    
                  ]
                },"configuracao": {
                  Row: {
                    "atualizado_em": string,"comissao_pct": number,"cota_padrao": number,"dias_acompanhamento": number,"dias_alerta_parado": number,"id": boolean,"piso_referencia": number,"preco_tabela": number
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"comissao_pct": number,"cota_padrao": number,"dias_acompanhamento": number,"dias_alerta_parado": number,"id"?: boolean,"piso_referencia": number,"preco_tabela": number
                  }
                  Update: {
                    "atualizado_em"?: string,"comissao_pct"?: number,"cota_padrao"?: number,"dias_acompanhamento"?: number,"dias_alerta_parado"?: number,"id"?: boolean,"piso_referencia"?: number,"preco_tabela"?: number
                  }
                  Relationships: [
                    
                  ]
                },"contatos": {
                  Row: {
                    "cargo": string | null,"criado_em": string,"criado_por": string | null,"id": string,"lead_id": string,"nome": string | null,"telefone_e164": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cargo"?: string | null,"criado_em"?: string,"criado_por"?: string | null,"id"?: string,"lead_id": string,"nome"?: string | null,"telefone_e164"?: string | null
                  }
                  Update: {
                    "cargo"?: string | null,"criado_em"?: string,"criado_por"?: string | null,"id"?: string,"lead_id"?: string,"nome"?: string | null,"telefone_e164"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contatos_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contatos_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"etapas_funil": {
                  Row: {
                    "nome": string,"posicao": number,"slug": string,"terminal": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "nome": string,"posicao": number,"slug": string,"terminal"?: boolean
                  }
                  Update: {
                    "nome"?: string,"posicao"?: number,"slug"?: string,"terminal"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"eventos_lead": {
                  Row: {
                    "autor_id": string | null,"criado_em": string,"dados": NonNullable<Json>,"id": number,"lead_id": string,"mensagem_id": number | null,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "autor_id"?: string | null,"criado_em"?: string,"dados"?: NonNullable<Json>,"id"?: never,"lead_id": string,"mensagem_id"?: number | null,"tipo": string
                  }
                  Update: {
                    "autor_id"?: string | null,"criado_em"?: string,"dados"?: NonNullable<Json>,"id"?: never,"lead_id"?: string,"mensagem_id"?: number | null,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "eventos_lead_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "eventos_lead_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "eventos_lead_mensagem_id_fkey"
      columns: ["mensagem_id"]
isOneToOne: false
      referencedRelation: "mensagens_lead"
      referencedColumns: ["id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "abertura_enviada_em": string | null,"acompanhamento_enviado_em": string | null,"atualizado_em": string,"avaliacoes": number | null,"categoria": string | null,"cidade_id": string,"criado_em": string,"dono_id": string | null,"email": string | null,"endereco": string | null,"estado": string,"etapa": string | null,"etapa_desde": string | null,"fim_em": string | null,"fim_por": string | null,"gancho": string | null,"google_place_id": string | null,"grupo": string | null,"id": string,"instagram": string | null,"motivo_fim": string | null,"nicho_id": string | null,"nome": string,"nota": number | null,"origem_id": string | null,"passo": string | null,"principal_enviada_em": string | null,"prioridade": number | null,"proximo_passo_em": string | null,"reservado_em": string | null,"seguidores": number | null,"seguidores_em": string | null,"site": string | null,"ultima_atividade_em": string | null,"veredito_atual": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "abertura_enviada_em"?: string | null,"acompanhamento_enviado_em"?: string | null,"atualizado_em"?: string,"avaliacoes"?: number | null,"categoria"?: string | null,"cidade_id": string,"criado_em"?: string,"dono_id"?: string | null,"email"?: string | null,"endereco"?: string | null,"estado"?: string,"etapa"?: string | null,"etapa_desde"?: string | null,"fim_em"?: string | null,"fim_por"?: string | null,"gancho"?: string | null,"google_place_id"?: string | null,"grupo"?: string | null,"id"?: string,"instagram"?: string | null,"motivo_fim"?: string | null,"nicho_id"?: string | null,"nome": string,"nota"?: number | null,"origem_id"?: string | null,"passo"?: string | null,"principal_enviada_em"?: string | null,"prioridade"?: number | null,"proximo_passo_em"?: string | null,"reservado_em"?: string | null,"seguidores"?: number | null,"seguidores_em"?: string | null,"site"?: string | null,"ultima_atividade_em"?: string | null,"veredito_atual"?: string | null
                  }
                  Update: {
                    "abertura_enviada_em"?: string | null,"acompanhamento_enviado_em"?: string | null,"atualizado_em"?: string,"avaliacoes"?: number | null,"categoria"?: string | null,"cidade_id"?: string,"criado_em"?: string,"dono_id"?: string | null,"email"?: string | null,"endereco"?: string | null,"estado"?: string,"etapa"?: string | null,"etapa_desde"?: string | null,"fim_em"?: string | null,"fim_por"?: string | null,"gancho"?: string | null,"google_place_id"?: string | null,"grupo"?: string | null,"id"?: string,"instagram"?: string | null,"motivo_fim"?: string | null,"nicho_id"?: string | null,"nome"?: string,"nota"?: number | null,"origem_id"?: string | null,"passo"?: string | null,"principal_enviada_em"?: string | null,"prioridade"?: number | null,"proximo_passo_em"?: string | null,"reservado_em"?: string | null,"seguidores"?: number | null,"seguidores_em"?: string | null,"site"?: string | null,"ultima_atividade_em"?: string | null,"veredito_atual"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_cidade_id_fkey"
      columns: ["cidade_id"]
isOneToOne: false
      referencedRelation: "cidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_dono_id_fkey"
      columns: ["dono_id"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_etapa_fkey"
      columns: ["etapa"]
isOneToOne: false
      referencedRelation: "etapas_funil"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "leads_fim_por_fkey"
      columns: ["fim_por"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_nicho_id_fkey"
      columns: ["nicho_id"]
isOneToOne: false
      referencedRelation: "nichos"
      referencedColumns: ["id"]
    }
                  ]
                },"mensagens_lead": {
                  Row: {
                    "aprovada_em": string | null,"autor_id": string | null,"criado_em": string,"id": number,"lead_id": string,"modelo": string | null,"observacao": string | null,"partes": (string)[],"status": string,"versao": number
                  }
                  ComputedFields: never
                  Insert: {
                    "aprovada_em"?: string | null,"autor_id"?: string | null,"criado_em"?: string,"id"?: never,"lead_id": string,"modelo"?: string | null,"observacao"?: string | null,"partes": (string)[],"status"?: string,"versao": number
                  }
                  Update: {
                    "aprovada_em"?: string | null,"autor_id"?: string | null,"criado_em"?: string,"id"?: never,"lead_id"?: string,"modelo"?: string | null,"observacao"?: string | null,"partes"?: (string)[],"status"?: string,"versao"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "mensagens_lead_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mensagens_lead_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"modelos_mensagem": {
                  Row: {
                    "ativo": boolean,"autor_id": string | null,"criado_em": string,"id": number,"nicho_id": string | null,"rotulo": string,"texto": string,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"autor_id"?: string | null,"criado_em"?: string,"id"?: never,"nicho_id"?: string | null,"rotulo"?: string,"texto": string,"tipo": string
                  }
                  Update: {
                    "ativo"?: boolean,"autor_id"?: string | null,"criado_em"?: string,"id"?: never,"nicho_id"?: string | null,"rotulo"?: string,"texto"?: string,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "modelos_mensagem_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "modelos_mensagem_nicho_id_fkey"
      columns: ["nicho_id"]
isOneToOne: false
      referencedRelation: "nichos"
      referencedColumns: ["id"]
    }
                  ]
                },"nichos": {
                  Row: {
                    "ativo": boolean,"clinica": boolean,"conselho": string | null,"dor": string,"id": string,"nome": string,"template_site": string | null,"transformacao": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"clinica"?: boolean,"conselho"?: string | null,"dor"?: string,"id"?: string,"nome": string,"template_site"?: string | null,"transformacao"?: string
                  }
                  Update: {
                    "ativo"?: boolean,"clinica"?: boolean,"conselho"?: string | null,"dor"?: string,"id"?: string,"nome"?: string,"template_site"?: string | null,"transformacao"?: string
                  }
                  Relationships: [
                    
                  ]
                },"pedidos_previa": {
                  Row: {
                    "enviada_em": string | null,"id": string,"lead_id": string,"pdf_url": string | null,"pedido_em": string,"pronta_em": string | null,"pronta_por": string | null,"site_url": string | null,"status": string,"vendedor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "enviada_em"?: string | null,"id"?: string,"lead_id": string,"pdf_url"?: string | null,"pedido_em"?: string,"pronta_em"?: string | null,"pronta_por"?: string | null,"site_url"?: string | null,"status"?: string,"vendedor_id": string
                  }
                  Update: {
                    "enviada_em"?: string | null,"id"?: string,"lead_id"?: string,"pdf_url"?: string | null,"pedido_em"?: string,"pronta_em"?: string | null,"pronta_por"?: string | null,"site_url"?: string | null,"status"?: string,"vendedor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pedidos_previa_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_previa_pronta_por_fkey"
      columns: ["pronta_por"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pedidos_previa_vendedor_id_fkey"
      columns: ["vendedor_id"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    }
                  ]
                },"perfis": {
                  Row: {
                    "artigo": string,"ativo": boolean,"comissao_pct": number | null,"cota_diaria": number,"criado_em": string,"curso": string,"email": string,"id": string,"nome": string,"papel": string,"ultimo_acesso_em": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "artigo"?: string,"ativo"?: boolean,"comissao_pct"?: number | null,"cota_diaria"?: number,"criado_em"?: string,"curso"?: string,"email"?: string,"id": string,"nome"?: string,"papel"?: string,"ultimo_acesso_em"?: string | null
                  }
                  Update: {
                    "artigo"?: string,"ativo"?: boolean,"comissao_pct"?: number | null,"cota_diaria"?: number,"criado_em"?: string,"curso"?: string,"email"?: string,"id"?: string,"nome"?: string,"papel"?: string,"ultimo_acesso_em"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"telefones_lead": {
                  Row: {
                    "criado_em": string,"e164": string,"id": number,"invalido_em": string | null,"lead_id": string,"origem": string | null,"principal": boolean,"tipo": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"e164": string,"id"?: never,"invalido_em"?: string | null,"lead_id": string,"origem"?: string | null,"principal"?: boolean,"tipo"?: string | null
                  }
                  Update: {
                    "criado_em"?: string,"e164"?: string,"id"?: never,"invalido_em"?: string | null,"lead_id"?: string,"origem"?: string | null,"principal"?: boolean,"tipo"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "telefones_lead_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"verificacoes_site": {
                  Row: {
                    "criado_em": string,"evidencias": NonNullable<Json>,"ferramenta": string | null,"id": number,"lead_id": string,"veredito": string,"verificado_em": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criado_em"?: string,"evidencias"?: NonNullable<Json>,"ferramenta"?: string | null,"id"?: never,"lead_id": string,"veredito": string,"verificado_em"?: string
                  }
                  Update: {
                    "criado_em"?: string,"evidencias"?: NonNullable<Json>,"ferramenta"?: string | null,"id"?: never,"lead_id"?: string,"veredito"?: string,"verificado_em"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "verificacoes_site_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "importar_leads":
{ Args: { "p_autor": string,"p_itens": Json }; Returns: {
              "indice": number,"lead_id": string,"resultado": string
            }[]
                           },
"importar_mensagens":
{ Args: { "p_autor": string,"p_itens": Json }; Returns: {
              "indice": number,"mensagem_id": number,"resultado": string
            }[]
                           },
"importar_modelos":
{ Args: { "p_autor": string,"p_modelos": Json,"p_nichos": Json }; Returns: number
                           },
"largar_lead":
{ Args: { "p_lead_id": string,"p_motivo": string }; Returns: undefined
                           },
"marcar_acesso":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"minha_cota":
{ Args: Record<PropertyKey, never>; Returns: {
              "abertas_hoje": number,"cota": number
            }[]
                           },
"proximo_lead":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"registrar_acao":
{ Args: { "p_acao": string,"p_lead_id": string,"p_mensagem_id"?: number }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
