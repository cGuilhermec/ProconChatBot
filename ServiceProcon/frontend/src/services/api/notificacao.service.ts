import { API_BASE_URL } from './api';

export interface Notificacao {
    NOTIFICACAO_ID: number;
    usuario_id: number;
    pergunta_id: number;
    tipo: string;
    mensagem: string;
    lida: boolean;
    palavras_encontradas: string[];
    gravidade: number;
    created_at: string;
    pergunta?: {
        Pergunta_ID: number;
        tema: string;
        pergunta: string;
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

export const notificacaoService = {
    // Buscar minhas notificações
    minhasNotificacoes: async (apenasNaoLidas?: boolean): Promise<Notificacao[]> => {
        const url = apenasNaoLidas ? '/minhas-notificacoes?nao_lidas=true' : '/minhas-notificacoes';
        const data = await request(url);
        return data.dados || [];
    },

    // Marcar notificação como lida
    marcarComoLida: async (id: number): Promise<void> => {
        await request(`/notificacao/${id}/ler`, { method: 'PUT' });
    },

    // Contar notificações não lidas
    contarNaoLidas: async (): Promise<number> => {
        const data = await request('/notificacoes/nao-lidas/contagem');
        return data.total || 0;
    },
};