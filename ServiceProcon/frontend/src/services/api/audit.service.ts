import { API_BASE_URL } from './api';

export interface AuditLog {
    id: number;
    usuario_id: number;
    acao: string;
    dados_anteriores: any;
    dados_novos: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    usuario?: {
        USUARIO_ID: number;
        nome: string;
        email: string;
        role: string;
    };
    pergunta?: {
        Pergunta_ID: number;
        tema: string;
        pergunta: string;
    };
}

export interface LogsResponse {
    dados: AuditLog[];
    total: number;
    pagina: number;
    totalPaginas: number;
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

export const auditService = {
    // Usuário vê seus próprios logs (COORDENADOR, DIRETOR, DEV)
    meusLogs: async (): Promise<AuditLog[]> => {
        const data = await request('/meus-logs');
        return data.dados || [];
    },

    // Admin: listar todos os logs com paginação e filtros
    listarTodos: async (
        page: number = 1,
        limit: number = 50,
        filtros?: {
            acao?: string;
            data_inicio?: string;
            data_fim?: string;
        }
    ): Promise<LogsResponse> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (filtros?.acao) params.append('acao', filtros.acao);
        if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);

        const data = await request(`/admin/logs?${params.toString()}`);
        return {
            dados: data.dados || [],
            total: data.total || 0,
            pagina: data.pagina || 1,
            totalPaginas: data.totalPaginas || 1,
        };
    },

    // Buscar logs por ação
    buscarPorAcao: async (acao: string, limit: number = 100): Promise<AuditLog[]> => {
        const data = await request(`/admin/logs/acao/${acao}?limit=${limit}`);
        return data.dados || [];
    },
};

// Mapeamento das ações para nomes amigáveis
export const acaoLabels: Record<string, { label: string; icon: string; color: string }> = {
    LOGIN_SUCESSO: { label: 'Login', icon: '🔑', color: '#34c759' },
    LOGIN_FALHA_USUARIO_NAO_ENCONTRADO: { label: 'Falha Login - Usuário não encontrado', icon: '❌', color: '#ff3b30' },
    LOGIN_FALHA_USUARIO_INATIVO: { label: 'Falha Login - Usuário inativo', icon: '❌', color: '#ff3b30' },
    LOGIN_FALHA_SENHA_INCORRETA: { label: 'Falha Login - Senha incorreta', icon: '❌', color: '#ff3b30' },
    CREATE_PROCON: { label: 'Criou Procon', icon: '🏢', color: '#007aff' },
    UPDATE_PROCON: { label: 'Atualizou Procon', icon: '✏️', color: '#ff9500' },
    DELETE_PROCON: { label: 'Removeu Procon', icon: '🗑️', color: '#ff3b30' },
    DESATIVAR_PROCON: { label: 'Desativou Procon', icon: '🔴', color: '#ff3b30' },
    ATIVAR_PROCON: { label: 'Ativou Procon', icon: '🟢', color: '#34c759' },
    CREATE_USER: { label: 'Criou Usuário', icon: '👤', color: '#007aff' },
    UPDATE_USER: { label: 'Atualizou Usuário', icon: '✏️', color: '#ff9500' },
    DELETE_USER: { label: 'Removeu Usuário', icon: '🗑️', color: '#ff3b30' },
    CREATE_PERGUNTA: { label: 'Criou Pergunta', icon: '❓', color: '#007aff' },
    UPDATE_PERGUNTA: { label: 'Atualizou Pergunta', icon: '✏️', color: '#ff9500' },
    DELETE_PERGUNTA: { label: 'Removeu Pergunta', icon: '🗑️', color: '#ff3b30' },
    CREATE_FERIADO: { label: 'Criou Feriado', icon: '📅', color: '#007aff' },
    UPDATE_FERIADO: { label: 'Atualizou Feriado', icon: '✏️', color: '#ff9500' },
    DELETE_FERIADO: { label: 'Removeu Feriado', icon: '🗑️', color: '#ff3b30' },
    PRIMEIRO_ACESSO: { label: 'Primeiro Acesso', icon: '🎯', color: '#5856d6' },
};