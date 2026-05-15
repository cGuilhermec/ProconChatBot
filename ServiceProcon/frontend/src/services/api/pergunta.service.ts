import { API_BASE_URL } from './api';

export interface Pergunta {
    Pergunta_ID: number;
    procon_id: number;
    criado_por: number;
    atualizado_por: number;
    revisado_por?: number;
    tema: string;
    pergunta: string;
    resposta: string;
    base_legal?: any;
    documentos?: any;
    observacao?: string;
    ativo: boolean;
    versao: number;
    status_moderacao: 'APROVADO' | 'PENDENTE_REVISAO' | 'REPROVADO' | 'BLOQUEADO';
    palavras_detectadas?: string[];
    motivo_reprovacao?: string;
    created_at: string;
    updated_at: string;
    criador?: {
        USUARIO_ID: number;
        nome: string;
        email: string;
    };
    atualizador?: {
        USUARIO_ID: number;
        nome: string;
        email: string;
    };
    revisador?: {
        USUARIO_ID: number;
        nome: string;
        email: string;
    };
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

export const perguntaService = {
    // Listar perguntas pendentes de revisão
    listarPendentes: async (): Promise<Pergunta[]> => {
        const data = await request('/admin/perguntas/pendentes');
        return data.dados || [];
    },

    // Listar todas as perguntas (admin)
    listarTodas: async (filtros?: { procon_id?: number; status?: string; apenas_ativos?: boolean }): Promise<Pergunta[]> => {
        const params = new URLSearchParams();
        if (filtros?.procon_id) params.append('procon_id', String(filtros.procon_id));
        if (filtros?.status) params.append('status', filtros.status);
        if (filtros?.apenas_ativos) params.append('apenas_ativos', 'true');

        const url = `/admin/perguntas${params.toString() ? `?${params.toString()}` : ''}`;
        console.log('🔍 Buscando perguntas na URL:', url);

        const data = await request(url);
        console.log('📦 Resposta da API:', data);
        console.log('📦 Dados recebidos:', data.dados);

        return data.dados || [];
    },

    // Buscar pergunta por ID
    buscarPorId: async (id: number): Promise<Pergunta> => {
        const data = await request(`/pergunta/${id}`);
        return data.dados;
    },

    // Criar pergunta
    criar: async (pergunta: {
        procon_id: number;
        tema: string;
        pergunta: string;
        resposta: string;
        base_legal?: any;
        documentos?: any;
        observacao?: string;
    }): Promise<Pergunta> => {
        const data = await request('/pergunta', {
            method: 'POST',
            body: JSON.stringify(pergunta),
        });
        return data.dados;
    },

    // Atualizar pergunta
    atualizar: async (id: number, pergunta: Partial<Pergunta>): Promise<Pergunta> => {
        const data = await request(`/pergunta/${id}`, {
            method: 'PUT',
            body: JSON.stringify(pergunta),
        });
        return data.dados;
    },

    // Revisar pergunta (aprovar/reprovar/bloquear)
    revisar: async (id: number, status: string, motivo?: string): Promise<Pergunta> => {
        const data = await request(`/admin/pergunta/${id}/revisar`, {
            method: 'PUT',
            body: JSON.stringify({ status, motivo }),
        });
        return data.dados;
    },

    // Desativar pergunta
    desativar: async (id: number): Promise<Pergunta> => {
        const data = await request(`/pergunta/${id}/desativar`, {
            method: 'PUT',
        });
        return data.dados;
    },

    // Ativar pergunta
    ativar: async (id: number): Promise<Pergunta> => {
        const data = await request(`/pergunta/${id}/ativar`, {
            method: 'PUT',
        });
        return data.dados;
    },

    // Excluir pergunta (apenas DEV)
    excluir: async (id: number): Promise<void> => {
        await request(`/pergunta/${id}`, {
            method: 'DELETE',
        });
    },
    listarPublicas: async (proconId: number): Promise<Pergunta[]> => {
        const data = await request(`/perguntas?procon_id=${proconId}`);
        return data.dados || [];
    },
};

// Mapeamento de status
export const statusModeracaoLabels: Record<string, { label: string; icon: string; color: string }> = {
    APROVADO: { label: 'Aprovado', icon: '✅', color: '#34c759' },
    PENDENTE_REVISAO: { label: 'Pendente', icon: '⏳', color: '#ff9500' },
    REPROVADO: { label: 'Reprovado', icon: '❌', color: '#ff3b30' },
    BLOQUEADO: { label: 'Bloqueado', icon: '🔒', color: '#8e8e93' },
};