import { API_BASE_URL } from './api';

export interface Me {
    id: number;
    nome: string;
    email: string;
    role: string;
    procon_id: number;
    ativo: boolean;
    primeiro_acesso: boolean;
    created_at: string;
    updated_at: string;
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

export const meService = {
    getMe: async (): Promise<Me> => {
        const data = await request('/me');
        return data.dados || data.usuario;
    },
};