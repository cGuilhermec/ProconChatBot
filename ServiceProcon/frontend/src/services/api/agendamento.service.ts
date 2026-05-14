import { API_BASE_URL } from './api';

export interface Agendamento {
    AGENDAMENTO_ID: number;
    procon_id: number;
    nome_usuario: string;
    cpf: string;
    telefone: string;
    data_agendamento: string;
    horario_agendamento: string;
    status: 'PENDENTE' | 'COMPARECEU' | 'CANCELADO' | 'FALTOU';
    observacao?: string;
    created_at: string;
    procon?: {
        nome: string;
        endereco: string;
        telefone: string;
    };
}

export type StatusAgendamento = 'PENDENTE' | 'COMPARECEU' | 'CANCELADO' | 'FALTOU';

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

export const agendamentoService = {
    // Buscar agendamentos por CPF (admin)
    buscarPorCPF: async (cpf: string): Promise<Agendamento[]> => {
        const data = await request(`/admin/agendamentos?cpf=${cpf}`);
        return data.dados || [];
    },

    // Listar todos agendamentos com filtros
    listarTodos: async (filtros?: {
        procon_id?: number;
        status?: StatusAgendamento;
        data_inicio?: string;
        data_fim?: string;
        cpf?: string;
    }): Promise<Agendamento[]> => {
        const params = new URLSearchParams();
        if (filtros?.procon_id) params.append('procon_id', String(filtros.procon_id));
        if (filtros?.status) params.append('status', filtros.status);
        if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);
        if (filtros?.cpf) params.append('cpf', filtros.cpf);

        const url = `/admin/agendamentos${params.toString() ? `?${params.toString()}` : ''}`;
        const data = await request(url);
        return data.dados || [];
    },

    // Buscar agendamento por ID
    buscarPorId: async (id: number): Promise<Agendamento> => {
        const data = await request(`/admin/agendamento/${id}`);
        return data.dados;
    },

    // Atualizar status do agendamento
    atualizarStatus: async (id: number, status: StatusAgendamento): Promise<Agendamento> => {
        const data = await request(`/admin/agendamento/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
        return data.dados;
    },

    // Cancelar agendamento (público - usado pelo funcionário em nome do cliente)
    cancelarAgendamento: async (id: number, cpf: string): Promise<void> => {
        await request(`/agendamento/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ cpf }),
        });
    },
};