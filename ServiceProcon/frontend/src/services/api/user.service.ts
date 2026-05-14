import { API_BASE_URL } from './api';

export interface User {
    USUARIO_ID: number;
    nome: string;
    email: string;
    role: string;
    ativo: boolean;
    primeiro_acesso: boolean;
}

const getToken = () => localStorage.getItem('authToken');

const request = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();

    console.log('📤 Requisição:', {
        url: `${API_BASE_URL}${endpoint}`,
        method: options.method,
        body: options.body
    });

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

export const userService = {
    listarTodos: async (): Promise<User[]> => {
        const data = await request('/usuarios');
        return data.dados || [];
    },

    criar: async (usuario: {
        nome: string;
        email: string;
        senha: string;
        role: string;
        procon_id: number
    }): Promise<User> => {
        const data = await request('/usuario', {
            method: 'POST',
            body: JSON.stringify(usuario),
        });
        return data.dados || data.usuario;
    },

    atualizar: async (id: number, dados: Partial<User>): Promise<User> => {
        const data = await request(`/usuario/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados),
        });
        return data.usuario;
    },

    desativar: async (id: number): Promise<void> => {
        await request(`/desativar/${id}`, {
            method: 'PUT',
            body: JSON.stringify({}),
        });
    },

    ativar: async (id: number): Promise<void> => {
        await request(`/ativar/${id}`, {
            method: 'PUT',
            body: JSON.stringify({}),
        });
    },

    resetarSenha: async (id: number, novaSenha: string): Promise<void> => {
        await request(`/resetar-senha/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ novaSenha }),
        });
    },
};