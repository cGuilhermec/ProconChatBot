import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agendamentoService, type Agendamento, type StatusAgendamento } from '../../../services/api/agendamento.service';
import { showConfirm, showToast, showLoading, closeLoading } from '../../../utils/alert';
import './AgendamentosPage.css';

export const AgendamentosPage = () => {
    const navigate = useNavigate();
    const [cpf, setCpf] = useState('');
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

    const formatarCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+$/, '$1');
    };

    const handleSearch = async () => {
        const cpfLimpo = cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) {
            showToast('Digite um CPF válido com 11 dígitos', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const data = await agendamentoService.buscarPorCPF(cpfLimpo);
            setAgendamentos(data);
            if (data.length === 0) {
                showToast('Nenhum agendamento encontrado para este CPF', 'info');
            }
        } catch (error: any) {
            console.error('Erro ao buscar agendamentos:', error);
            showToast(error.message || 'Erro ao buscar agendamentos', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (agendamento: Agendamento, novoStatus: StatusAgendamento) => {
        const statusLabels: Record<StatusAgendamento, string> = {
            PENDENTE: 'Pendente',
            COMPARECEU: 'Compareceu',
            CANCELADO: 'Cancelado',
            FALTOU: 'Faltou',
        };

        const confirmed = await showConfirm(
            'Alterar Status',
            `Deseja alterar o status deste agendamento para "${statusLabels[novoStatus]}"?`,
            'Sim, alterar',
            'Cancelar'
        );

        if (!confirmed) return;

        showLoading('Atualizando status...');
        try {
            await agendamentoService.atualizarStatus(agendamento.AGENDAMENTO_ID, novoStatus);
            await handleSearch(); // Recarrega a lista
            closeLoading();
            showToast(`Status atualizado para ${statusLabels[novoStatus]}`, 'success');
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao atualizar status:', error);
            showToast(error.message || 'Erro ao atualizar status', 'error');
        }
    };

    const handleCancelar = async (agendamento: Agendamento) => {
        const confirmed = await showConfirm(
            'Cancelar Agendamento',
            `Tem certeza que deseja cancelar o agendamento de ${agendamento.nome_usuario} para o dia ${formatarData(agendamento.data_agendamento)} às ${formatarHorario(agendamento.horario_agendamento)}?`,
            'Sim, cancelar',
            'Cancelar'
        );

        if (!confirmed) return;

        showLoading('Cancelando agendamento...');
        try {
            await agendamentoService.cancelarAgendamento(agendamento.AGENDAMENTO_ID, agendamento.cpf);
            await handleSearch(); // Recarrega a lista
            closeLoading();
            showToast('Agendamento cancelado com sucesso!', 'success');
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao cancelar agendamento:', error);
            showToast(error.message || 'Erro ao cancelar agendamento', 'error');
        }
    };

    const formatarData = (data: string) => {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    };

    const formatarHorario = (horario: string) => {
        const date = new Date(horario);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadgeClass = (status: string) => {
        const classes: Record<string, string> = {
            PENDENTE: 'status-pendente',
            COMPARECEU: 'status-compareceu',
            CANCELADO: 'status-cancelado',
            FALTOU: 'status-faltou',
        };
        return classes[status] || 'status-pendente';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDENTE: 'Pendente',
            COMPARECEU: 'Compareceu',
            CANCELADO: 'Cancelado',
            FALTOU: 'Faltou',
        };
        return labels[status] || status;
    };

    return (
        <div className="agendamentos-page">
            <button className="btn-back" onClick={() => navigate('/')}>
                ← Voltar ao Dashboard
            </button>

            <div className="agendamentos-container">
                <div className="page-header">
                    <h1>📅 Agendamentos</h1>
                    <p>Gerencie os agendamentos dos clientes</p>
                </div>

                {/* Card informativo sobre novo agendamento */}
                <div className="info-card">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                        <h3>Novos agendamentos</h3>
                        <p>Os clientes devem realizar novos agendamentos exclusivamente pelo WhatsApp do Procon.</p>
                        <div className="info-whatsapp">📱 WhatsApp: (XX) XXXX-XXXX</div>
                    </div>
                </div>

                {/* Busca por CPF */}
                <div className="search-card">
                    <h2>🔍 Buscar Agendamentos</h2>
                    <div className="search-form">
                        <div className="input-group">
                            <label>CPF do Cliente</label>
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(formatarCPF(e.target.value))}
                                maxLength={14}
                            />
                        </div>
                        <button className="btn-search" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </div>

                {/* Lista de Agendamentos */}
                {agendamentos.length > 0 && (
                    <div className="agendamentos-list">
                        <h2>📋 Agendamentos Encontrados</h2>
                        <div className="agendamentos-grid">
                            {agendamentos.map((agendamento) => (
                                <div key={agendamento.AGENDAMENTO_ID} className="agendamento-card">
                                    <div className="card-header">
                                        <div className="card-title">
                                            <span className="card-icon">📌</span>
                                            <span>Agendamento #{agendamento.AGENDAMENTO_ID}</span>
                                        </div>
                                        <span className={`status-badge ${getStatusBadgeClass(agendamento.status)}`}>
                                            {getStatusLabel(agendamento.status)}
                                        </span>
                                    </div>

                                    <div className="card-body">
                                        <div className="info-row">
                                            <span className="info-label">👤 Cliente:</span>
                                            <span className="info-value">{agendamento.nome_usuario}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">📞 Telefone:</span>
                                            <span className="info-value">{agendamento.telefone}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">📅 Data:</span>
                                            <span className="info-value">{formatarData(agendamento.data_agendamento)}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">⏰ Horário:</span>
                                            <span className="info-value">{formatarHorario(agendamento.horario_agendamento)}</span>
                                        </div>
                                        {agendamento.observacao && (
                                            <div className="info-row">
                                                <span className="info-label">📝 Observação:</span>
                                                <span className="info-value">{agendamento.observacao}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-actions">
                                        <select
                                            className="status-select"
                                            value={agendamento.status}
                                            onChange={(e) => handleStatusChange(agendamento, e.target.value as StatusAgendamento)}
                                        >
                                            <option value="PENDENTE">📌 Pendente</option>
                                            <option value="COMPARECEU">✅ Compareceu</option>
                                            <option value="CANCELADO">❌ Cancelado</option>
                                            <option value="FALTOU">⚠️ Faltou</option>
                                        </select>

                                        {agendamento.status !== 'CANCELADO' && agendamento.status !== 'COMPARECEU' && (
                                            <button className="btn-cancel" onClick={() => handleCancelar(agendamento)}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};