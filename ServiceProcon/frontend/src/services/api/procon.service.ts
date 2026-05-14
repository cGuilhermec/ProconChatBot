import { API_BASE_URL } from './api';

export interface Procon {
    PROCON_ID: number;
    nome: string;
    endereco?: string;
    telefone?: string;
    email?: string;
    ativo: boolean;
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
    listarTodos: async (): Promise<Procon[]> => {
        const data = await request('/procons');
        return data.dados || data.procons || [];
    },
};