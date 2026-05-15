import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import { auditService, acaoLabels, type AuditLog } from '../../../services/api/audit.service';
import { showToast } from '../../../utils/alert';
import './AuditPage.css';

export const AuditPage = () => {
    const navigate = useNavigate();
    const { userRole } = usePermissions();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedAcao, setSelectedAcao] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [expandedLog, setExpandedLog] = useState<number | null>(null);

    const isAdmin = userRole === 'DIRETOR' || userRole === 'DEV';
    const isCoordinator = userRole === 'COORDENADOR';
    const canViewAllLogs = isAdmin || isCoordinator;

    const acoes = Object.entries(acaoLabels);

    useEffect(() => {
        loadLogs();
    }, [currentPage, selectedAcao, dataInicio, dataFim]);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const response = await auditService.listarTodos(currentPage, 50, {
                acao: selectedAcao || undefined,
                data_inicio: dataInicio || undefined,
                data_fim: dataFim || undefined,
            });
            setLogs(response.dados);
            setTotal(response.total);
            setTotalPages(response.totalPaginas);
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
            showToast('Erro ao carregar logs de auditoria', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const formatarData = (data: string) => {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getAcaoInfo = (acao: string) => {
        return acaoLabels[acao] || { label: acao, icon: '📝', color: '#8e8e93' };
    };

    const toggleExpand = (id: number) => {
        setExpandedLog(expandedLog === id ? null : id);
    };

    const formatJSON = (data: any) => {
        if (!data) return '—';
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    };

    return (
        <div className="audit-page">
            <button className="btn-back" onClick={() => navigate('/')}>
                ← Voltar ao Dashboard
            </button>

            <div className="audit-container">
                <div className="page-header">
                    <div className="header-left">
                        <h1>📋 Auditoria</h1>
                        <p>Registro de todas as atividades do sistema</p>
                    </div>
                    <div className="header-stats">
                        <span className="stats-badge">Total de registros: {total}</span>
                    </div>
                </div>

                {/* Filtros */}
                <div className="filters-card">
                    <h2>🔍 Filtros</h2>
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Ação</label>
                            <select
                                value={selectedAcao}
                                onChange={(e) => {
                                    setSelectedAcao(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Todas as ações</option>
                                {acoes.map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value.icon} {value.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Data Início</label>
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => {
                                    setDataInicio(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div className="filter-group">
                            <label>Data Fim</label>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => {
                                    setDataFim(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <button
                            className="btn-clear-filters"
                            onClick={() => {
                                setSelectedAcao('');
                                setDataInicio('');
                                setDataFim('');
                                setCurrentPage(1);
                            }}
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>

                {/* Lista de Logs */}
                {isLoading ? (
                    <div className="loading">Carregando logs...</div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>Nenhum log encontrado</h3>
                        <p>Tente ajustar os filtros de busca</p>
                    </div>
                ) : (
                    <>
                        <div className="logs-list">
                            {logs.map((log) => {
                                const acaoInfo = getAcaoInfo(log.acao);
                                return (
                                    <div key={log.id} className="log-card" onClick={() => toggleExpand(log.id)}>
                                        <div className="log-header">
                                            <div className="log-icon" style={{ backgroundColor: acaoInfo.color + '20', color: acaoInfo.color }}>
                                                {acaoInfo.icon}
                                            </div>
                                            <div className="log-info">
                                                <div className="log-title">
                                                    <span className="log-acao">{acaoInfo.label}</span>
                                                    <span className="log-usuario">
                                                        👤 {log.usuario?.nome || `Usuário #${log.usuario_id}`}
                                                    </span>
                                                </div>
                                                <div className="log-meta">
                                                    <span className="log-role">{log.usuario?.role || '—'}</span>
                                                    <span className="log-date">{formatarData(log.created_at)}</span>
                                                    {log.ip_address && (
                                                        <span className="log-ip">🌐 {log.ip_address}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="log-expand">
                                                {expandedLog === log.id ? '▲' : '▼'}
                                            </div>
                                        </div>

                                        {expandedLog === log.id && (
                                            <div className="log-details">
                                                {log.dados_anteriores && (
                                                    <div className="detail-section">
                                                        <strong>📦 Dados Anteriores:</strong>
                                                        <pre>{formatJSON(log.dados_anteriores)}</pre>
                                                    </div>
                                                )}
                                                {log.dados_novos && (
                                                    <div className="detail-section">
                                                        <strong>🆕 Dados Novos:</strong>
                                                        <pre>{formatJSON(log.dados_novos)}</pre>
                                                    </div>
                                                )}
                                                {log.pergunta && (
                                                    <div className="detail-section">
                                                        <strong>❓ Pergunta relacionada:</strong>
                                                        <div className="pergunta-info">
                                                            <div><strong>Tema:</strong> {log.pergunta.tema}</div>
                                                            <div><strong>Pergunta:</strong> {log.pergunta.pergunta}</div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="detail-section">
                                                    <strong>🖥️ User Agent:</strong>
                                                    <div className="user-agent">{log.user_agent || '—'}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    ← Anterior
                                </button>
                                <span className="pagination-info">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Próxima →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};