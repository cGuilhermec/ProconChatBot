import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { perguntaService, statusModeracaoLabels, type Pergunta } from '../../../services/api/pergunta.service';
import { showConfirm, showToast, showLoading, closeLoading } from '../../../utils/alert';

import './PerguntasPage.css';
import { PerguntaForm } from './PerguntaForm';

export const PerguntasPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { userRole, isAdmin } = usePermissions();
    const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
    const [filteredPerguntas, setFilteredPerguntas] = useState<Pergunta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedPergunta, setSelectedPergunta] = useState<Pergunta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showRevisaoModal, setShowRevisaoModal] = useState(false);
    const [revisaoStatus, setRevisaoStatus] = useState('');
    const [revisaoMotivo, setRevisaoMotivo] = useState('');
    const [perguntaEmRevisao, setPerguntaEmRevisao] = useState<Pergunta | null>(null);

    // Permissões
    const canManage = userRole === 'FUNCIONARIO' || userRole === 'COORDENADOR' || userRole === 'DIRETOR' || userRole === 'DEV';
    const canDelete = userRole === 'DEV';
    const canViewStatusFilter = userRole === 'COORDENADOR' || userRole === 'DIRETOR' || userRole === 'DEV';
    const canViewStatusBadge = userRole === 'COORDENADOR' || userRole === 'DIRETOR' || userRole === 'DEV';
    const canViewToggleButton = userRole === 'COORDENADOR' || userRole === 'DIRETOR' || userRole === 'DEV';

    useEffect(() => {
        loadPerguntas();
    }, []);

    useEffect(() => {
        let filtered = [...perguntas];

        if (searchTerm.trim()) {
            filtered = filtered.filter(p =>
                p.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.pergunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.resposta.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter && canViewStatusFilter) {
            filtered = filtered.filter(p => p.status_moderacao === statusFilter);
        }

        setFilteredPerguntas(filtered);
    }, [searchTerm, statusFilter, perguntas, canViewStatusFilter]);

    const loadPerguntas = async () => {
        try {
            setIsLoading(true);

            let data: Pergunta[] = [];

            if (userRole === 'FUNCIONARIO') {
                // Funcionário usa rota pública
                data = await perguntaService.listarPublicas(user?.procon_id || 1);
            } else {
                // Coordenador/Diretor/Dev usa rota admin
                data = await perguntaService.listarTodas();
            }

            setPerguntas(data);
            setFilteredPerguntas(data);
        } catch (error) {
            console.error('Erro ao carregar perguntas:', error);
            showToast('Erro ao carregar lista de perguntas', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedPergunta(null);
        setShowModal(true);
    };

    const handleEdit = (pergunta: Pergunta) => {
        setSelectedPergunta(pergunta);
        setShowModal(true);
    };

    const handleRevisar = (pergunta: Pergunta) => {
        setPerguntaEmRevisao(pergunta);
        setRevisaoStatus(pergunta.status_moderacao);
        setRevisaoMotivo('');
        setShowRevisaoModal(true);
    };

    const handleSubmitRevisao = async () => {
        if (!perguntaEmRevisao) return;

        const statusLabels: Record<string, string> = {
            APROVADO: 'aprovar',
            REPROVADO: 'reprovar',
            BLOQUEADO: 'bloquear'
        };

        const confirmed = await showConfirm(
            `${revisaoStatus === 'APROVADO' ? 'Aprovar' : revisaoStatus === 'REPROVADO' ? 'Reprovar' : 'Bloquear'} Pergunta`,
            `Tem certeza que deseja ${statusLabels[revisaoStatus]} esta pergunta?${revisaoMotivo ? `\nMotivo: ${revisaoMotivo}` : ''}`,
            'Sim, confirmar',
            'Cancelar'
        );

        if (!confirmed) return;

        showLoading('Processando...');
        try {
            await perguntaService.revisar(perguntaEmRevisao.Pergunta_ID, revisaoStatus, revisaoMotivo);
            await loadPerguntas();
            closeLoading();
            showToast(`Pergunta ${statusLabels[revisaoStatus]}da com sucesso!`, 'success');
            setShowRevisaoModal(false);
            setPerguntaEmRevisao(null);
            setRevisaoMotivo('');
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao revisar pergunta:', error);
            showToast(error.message || 'Erro ao revisar pergunta', 'error');
        }
    };

    const handleToggleStatus = async (pergunta: Pergunta) => {
        const action = pergunta.ativo ? 'desativar' : 'ativar';
        const confirmed = await showConfirm(
            pergunta.ativo ? 'Desativar Pergunta' : 'Ativar Pergunta',
            `Tem certeza que deseja ${action} esta pergunta?`,
            `Sim, ${action}`,
            'Cancelar'
        );

        if (!confirmed) return;

        showLoading(pergunta.ativo ? 'Desativando...' : 'Ativando...');
        try {
            if (pergunta.ativo) {
                await perguntaService.desativar(pergunta.Pergunta_ID);
            } else {
                await perguntaService.ativar(pergunta.Pergunta_ID);
            }
            await loadPerguntas();
            closeLoading();
            showToast(`Pergunta ${pergunta.ativo ? 'desativada' : 'ativada'} com sucesso!`, 'success');
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao alterar status:', error);
            showToast(error.message || 'Erro ao alterar status', 'error');
        }
    };

    const handleDelete = async (pergunta: Pergunta) => {
        const confirmed = await showConfirm(
            'Excluir Pergunta',
            `Tem certeza que deseja excluir permanentemente a pergunta "${pergunta.tema}"? Esta ação não pode ser desfeita.`,
            'Sim, excluir',
            'Cancelar'
        );

        if (!confirmed) return;

        showLoading('Excluindo...');
        try {
            await perguntaService.excluir(pergunta.Pergunta_ID);
            await loadPerguntas();
            closeLoading();
            showToast('Pergunta excluída com sucesso!', 'success');
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao excluir pergunta:', error);
            showToast(error.message || 'Erro ao excluir pergunta', 'error');
        }
    };

    const formatarData = (data: string) => {
        if (!data) return '—';
        try {
            const date = new Date(data);
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return '—';
        }
    };

    const getStatusInfo = (status: string) => {
        return statusModeracaoLabels[status] || { label: status, icon: '📌', color: '#8e8e93' };
    };

    const handleFormSuccess = () => {
        setShowModal(false);
        loadPerguntas();
    };

    return (
        <div className="perguntas-page">
            <button className="btn-back" onClick={() => navigate('/')}>
                ← Voltar ao Dashboard
            </button>

            <div className="perguntas-container">
                <div className="page-header">
                    <div className="header-left">
                        <h1>❓ Perguntas Frequentes</h1>
                        <p>Gerencie as perguntas e respostas do FAQ</p>
                    </div>
                    {canManage && (
                        <button className="btn-primary" onClick={handleCreate}>
                            + Nova Pergunta
                        </button>
                    )}
                </div>

                {/* Filtros e busca */}
                <div className="filters-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por tema, pergunta ou resposta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>
                        )}
                    </div>

                    {/* Filtro de status - só aparece para COORDENADOR, DIRETOR, DEV */}
                    {canViewStatusFilter && (
                        <div className="status-filter">
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="">Todos os status</option>
                                <option value="APROVADO">✅ Aprovados</option>
                                <option value="PENDENTE_REVISAO">⏳ Pendentes</option>
                                <option value="REPROVADO">❌ Reprovados</option>
                                <option value="BLOQUEADO">🔒 Bloqueados</option>
                            </select>
                        </div>
                    )}

                    <div className="filter-info">
                        {filteredPerguntas.length} de {perguntas.length} perguntas
                    </div>
                </div>

                {/* Lista de Perguntas */}
                {isLoading ? (
                    <div className="loading">Carregando perguntas...</div>
                ) : filteredPerguntas.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">❓</div>
                        <h3>Nenhuma pergunta encontrada</h3>
                        <p>{searchTerm ? 'Tente outro termo de busca' : 'Clique em "Nova Pergunta" para adicionar'}</p>
                    </div>
                ) : (
                    <div className="perguntas-grid">
                        {filteredPerguntas.map((pergunta) => {
                            const statusInfo = getStatusInfo(pergunta.status_moderacao);
                            return (
                                <div key={pergunta.Pergunta_ID} className={`pergunta-card ${!pergunta.ativo ? 'inactive' : ''}`}>
                                    <div className="card-header">
                                        <div className="card-status">
                                            {canViewStatusBadge && (
                                                <span className={`status-badge status-${pergunta.status_moderacao.toLowerCase()}`}>
                                                    {statusInfo.icon} {statusInfo.label}
                                                </span>
                                            )}
                                            {!pergunta.ativo && canViewStatusBadge && (
                                                <span className="status-badge status-inactive">🔴 Inativa</span>
                                            )}
                                        </div>

                                        <div className="card-title">
                                            <h3>{pergunta.tema}</h3>
                                        </div>

                                        <div className="card-meta">
                                            {pergunta.criador?.nome && (
                                                <span>Criado por: {pergunta.criador.nome}</span>
                                            )}
                                            {pergunta.created_at && (
                                                <span>{formatarData(pergunta.created_at)}</span>
                                            )}
                                            {pergunta.atualizador && pergunta.atualizador.nome && (
                                                <span>Atualizado por: {pergunta.atualizador.nome}</span>
                                            )}
                                            {pergunta.revisador && pergunta.revisador.nome && (
                                                <span>Revisado por: {pergunta.revisador.nome}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div className="info-section">
                                            <strong>📝 Pergunta:</strong>
                                            <p>{pergunta.pergunta}</p>
                                        </div>
                                        <div className="info-section">
                                            <strong>💬 Resposta:</strong>
                                            <p>{pergunta.resposta}</p>
                                        </div>
                                        {pergunta.palavras_detectadas && pergunta.palavras_detectadas.length > 0 && canViewStatusBadge && (
                                            <div className="info-section sensitive">
                                                <strong>⚠️ Palavras detectadas:</strong>
                                                <div className="sensitive-words">
                                                    {pergunta.palavras_detectadas.map(word => (
                                                        <span key={word} className="sensitive-word">{word}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {pergunta.motivo_reprovacao && canViewStatusBadge && (
                                            <div className="info-section motivo">
                                                <strong>📋 Motivo da reprovação:</strong>
                                                <p>{pergunta.motivo_reprovacao}</p>
                                            </div>
                                        )}
                                        {pergunta.observacao && (
                                            <div className="info-section">
                                                <strong>📌 Observação:</strong>
                                                <p>{pergunta.observacao}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-actions">
                                        {canManage && (
                                            <>
                                                {pergunta.status_moderacao === 'PENDENTE_REVISAO' && (
                                                    <button className="btn-review" onClick={() => handleRevisar(pergunta)}>
                                                        📋 Revisar
                                                    </button>
                                                )}
                                                <button className="btn-edit" onClick={() => handleEdit(pergunta)}>
                                                    ✏️ Editar
                                                </button>
                                                {/* Botão de ativar/desativar - só aparece para COORDENADOR, DIRETOR, DEV */}
                                                {canViewToggleButton && (
                                                    <button
                                                        className={`btn-status ${pergunta.ativo ? 'btn-deactivate' : 'btn-activate'}`}
                                                        onClick={() => handleToggleStatus(pergunta)}
                                                    >
                                                        {pergunta.ativo ? '🔴 Desativar' : '🟢 Ativar'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {canDelete && (
                                            <button className="btn-delete" onClick={() => handleDelete(pergunta)}>
                                                🗑️ Excluir
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Formulário */}
            {showModal && (
                <PerguntaForm
                    pergunta={selectedPergunta}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Modal de Revisão */}
            {showRevisaoModal && perguntaEmRevisao && (
                <div className="modal-overlay">
                    <div className="modal-container revisao-modal">
                        <div className="modal-header">
                            <h2>📋 Revisar Pergunta</h2>
                            <button className="modal-close" onClick={() => setShowRevisaoModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="revisao-info">
                                <p><strong>Tema:</strong> {perguntaEmRevisao.tema}</p>
                                <p><strong>Pergunta:</strong> {perguntaEmRevisao.pergunta}</p>
                                <p><strong>Resposta:</strong> {perguntaEmRevisao.resposta}</p>
                                {perguntaEmRevisao.palavras_detectadas && perguntaEmRevisao.palavras_detectadas.length > 0 && (
                                    <div className="sensitive-warning">
                                        <strong>⚠️ Palavras sensíveis detectadas:</strong>
                                        <div className="sensitive-words">
                                            {perguntaEmRevisao.palavras_detectadas.map(word => (
                                                <span key={word} className="sensitive-word">{word}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Decisão *</label>
                                <select value={revisaoStatus} onChange={(e) => setRevisaoStatus(e.target.value)}>
                                    <option value="APROVADO">✅ Aprovar</option>
                                    <option value="REPROVADO">❌ Reprovar</option>
                                    <option value="BLOQUEADO">🔒 Bloquear</option>
                                </select>
                            </div>

                            {revisaoStatus !== 'APROVADO' && (
                                <div className="form-group">
                                    <label>Motivo *</label>
                                    <textarea
                                        value={revisaoMotivo}
                                        onChange={(e) => setRevisaoMotivo(e.target.value)}
                                        placeholder="Informe o motivo da reprovação/bloqueio..."
                                        rows={3}
                                        required
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => setShowRevisaoModal(false)}>
                                Cancelar
                            </button>
                            <button type="button" className="btn-primary" onClick={handleSubmitRevisao}>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};