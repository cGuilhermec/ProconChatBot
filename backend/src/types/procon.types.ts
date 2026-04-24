// src/types/procon.types.ts
export interface ProconItem {
  id: number;
  tema: string;
  pergunta: string;
  resposta: string;
  base_legal: string[];
  documentos: string[];
  observacao: string;
}

export interface ResultadoBusca {
  item: ProconItem;
  score: number;
  metodo: "palavras_chave" | "fuse" | "fallback";
  confianca: "Alta" | "Média" | "Baixa";
}

export interface RespostaProcon {
  pergunta: string;
  resposta: string;
  base_legal?: string[];
  documentos?: string[];
  observacao?: string;
  confianca: string;
  metodo: string;
  score: number;
}

export interface KeywordIndex {
  [key: string]: number[];
}

export interface RespostaProconComLlama extends RespostaProcon {
  enriquecido?: boolean;
  llm_error?: boolean;
}

export interface Procon {
  nome: string;
  cidade: string;
  estado: string;
  endereco: string;
  telefone: string;
  email: string;
  horario_abertura: Date;
  horario_fechamento: Date;
  duracao_atendimento_minutos: number;
  vagas_por_horario: number;
}