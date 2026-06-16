import { API_BASE_URL } from './api';

export interface Feriado {
    FERIADO_ID: number;
    procon_id: number;
    data: string;
    nome: string;
    recorrente: boolean;
    created_at: string;
    updated_at: string;
    procon?: {
        PROCON_ID: number;
        nome: string;
        cidade: string;
    };
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

export const feriadoService = {
    // Listar todos os feriados
    listarTodos: async (proconId?: number): Promise<Feriado[]> => {
        const url = proconId ? `/feriados?procon_id=${proconId}` : '/feriados';
        const data = await request(url);
        // console.log(data);
        
        return data.dados || [];
    },

    // Buscar feriado por ID
    buscarPorId: async (id: number): Promise<Feriado> => {
        const data = await request(`/feriado/${id}`);
        return data.dados;
    },

    // Criar feriado
    criar: async (feriado: { procon_id: number; data: string; nome: string; recorrente: boolean }): Promise<Feriado> => {
        const data = await request('/feriado', {
            method: 'POST',
            body: JSON.stringify(feriado),
        });
        return data.dados;
    },

    // Atualizar feriado
    atualizar: async (id: number, feriado: { data?: string; nome?: string; recorrente?: boolean }): Promise<Feriado> => {
        const data = await request(`/feriado/${id}`, {
            method: 'PUT',
            body: JSON.stringify(feriado),
        });
        return data.dados;
    },

    // Excluir feriado
    excluir: async (id: number): Promise<void> => {
        await request(`/feriado/${id}`, {
            method: 'DELETE',
        });
    },

    // Verificar se é feriado
    verificarFeriado: async (proconId: number, data: string): Promise<boolean> => {
        const response = await request(`/feriado/verificar?procon_id=${proconId}&data=${data}`);
        return response.isFeriado;
    },
};