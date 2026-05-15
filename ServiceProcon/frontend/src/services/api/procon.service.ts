import { API_BASE_URL } from './api';
import type { Pergunta } from './pergunta.service';

export interface Procon {
    PROCON_ID: number;
    nome: string;
    cidade: string;
    estado: string;
    endereco: string;
    telefone: string;
    email: string;
    horario_abertura: string;
    horario_fechamento: string;
    duracao_atendimento_minutos: number;
    vagas_por_horario: number;
    whatsapp_number?: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
    usuarios?: Array<{
        USUARIO_ID: number;
        nome: string;
        email: string;
        role: string;
        ativo: boolean;
    }>;
}

export interface CreateProconDTO {
    nome: string;
    cidade: string;
    estado: string;
    endereco: string;
    telefone: string;
    email: string;
    horario_abertura: string;
    horario_fechamento: string;
    duracao_atendimento_minutos: number;
    vagas_por_horario: number;
    whatsapp_number?: string;
}

export interface UpdateProconDTO {
    nome?: string;
    cidade?: string;
    estado?: string;
    endereco?: string;
    telefone?: string;
    email?: string;
    horario_abertura?: string;
    horario_fechamento?: string;
    duracao_atendimento_minutos?: number;
    vagas_por_horario?: number;
    whatsapp_number?: string;
}

const getToken = () => localStorage.getItem('authToken');

const request = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.mensagem || data.erro || 'Erro na requisição');
    }

    return data;
};

export const proconService = {
    // Listar todos os Procons
    listarTodos: async (): Promise<Procon[]> => {
        const data = await request('/procons');
        return data.dados || [];
    },

    // Buscar Procon por ID
    buscarPorId: async (id: number): Promise<Procon> => {
        const data = await request(`/procon/${id}`);
        return data.dados;
    },

    // Criar Procon - usando CreateProconDTO (sem 'ativo')
    criar: async (procon: CreateProconDTO): Promise<Procon> => {
        const data = await request('/procon', {
            method: 'POST',
            body: JSON.stringify(procon),
        });
        return data.dados;
    },

    // Atualizar Procon - usando UpdateProconDTO
    atualizar: async (id: number, procon: UpdateProconDTO): Promise<Procon> => {
        const data = await request(`/procon/${id}`, {
            method: 'PUT',
            body: JSON.stringify(procon),
        });
        return data.dados;
    },

    // Desativar Procon
    desativar: async (id: number): Promise<Procon> => {
        const data = await request(`/procon/${id}/desativar`, {
            method: 'PUT',
        });
        return data.dados;
    },

    // Ativar Procon
    ativar: async (id: number): Promise<Procon> => {
        const data = await request(`/procon/${id}/ativar`, {
            method: 'PUT',
        });
        return data.dados;
    },

    // Excluir Procon (apenas DIRETOR/DEV)
    excluir: async (id: number): Promise<void> => {
        await request(`/procon/${id}`, {
            method: 'DELETE',
        });
    },

};