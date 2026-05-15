import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { proconService, type Procon } from '../../../services/api/procon.service';
import { showConfirm, showToast, showLoading, closeLoading } from '../../../utils/alert';

import './ProconsPage.css';
import { ProconForm } from './ProconForm';

export const ProconsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { userRole, isAdmin, isDeveloper } = usePermissions();
    const [procons, setProcons] = useState<Procon[]>([]);
    const [filteredProcons, setFilteredProcons] = useState<Procon[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedProcon, setSelectedProcon] = useState<Procon | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const canManageProcons = userRole === 'DIRETOR' || userRole === 'DEV';
    const canDeleteProcon = userRole === 'DIRETOR' || userRole === 'DEV';

    useEffect(() => {
        loadProcons();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProcons(procons);
        } else {
            const filtered = procons.filter(procon =>
                procon.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                procon.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                procon.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProcons(filtered);
        }
    }, [searchTerm, procons]);

    const loadProcons = async () => {
        try {
            setIsLoading(true);
            const data = await proconService.listarTodos();
            setProcons(data);
            setFilteredProcons(data);
        } catch (error) {
            console.error('Erro ao carregar Procons:', error);
            showToast('Erro ao carregar lista de Procons', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedProcon(null);
        setShowModal(true);
    };

    const handleEdit = (procon: Procon) => {
        setSelectedProcon(procon);
        setShowModal(true);
    };

    const handleToggleStatus = async (procon: Procon) => {
        const action = procon.ativo ? 'desativar' : 'ativar';
        const title = procon.ativo ? 'Desativar Procon' : 'Ativar Procon';
        const message = procon.ativo
            ? `Tem certeza que deseja desativar o Procon "${procon.nome}"?`
            : `Tem certeza que deseja ativar o Procon "${procon.nome}"?`;

        const confirmed = await showConfirm(title, message, `Sim, ${action}`, 'Cancelar');

        if (!confirmed) return;

        showLoading(procon.ativo ? 'Desativando Procon...' : 'Ativando Procon...');
        try {
            if (procon.ativo) {
                await proconService.desativar(procon.PROCON_ID);
            } else {
                await proconService.ativar(procon.PROCON_ID);
            }
            await loadProcons();
            closeLoading();
            showToast(procon.ativo ? 'Procon desativado com sucesso!' : 'Procon ativado com sucesso!', 'success');
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao alterar status:', error);
            showToast(error.message || 'Erro ao alterar status', 'error');
        }
    };

    const handleDelete = async (procon: Procon) => {
        const confirmed = await showConfirm(
            'Excluir Procon',
            `Tem certeza que deseja excluir o Procon "${procon.nome}"? Esta ação não pode ser desfeita.`,
            'Sim, excluir',
            'Cancelar'
        );

        if (!confirmed) return;

        showLoading('Excluindo Procon...');
        try {
            await proconService.excluir(procon.PROCON_ID);
            await loadProcons();
            closeLoading();
            showToast('Procon excluído com sucesso!', 'success');
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao excluir Procon:', error);
            showToast(error.message || 'Erro ao excluir Procon', 'error');
        }
    };

    const formatarHorario = (horario: string) => {
        if (!horario) return 'Não definido';
        const date = new Date(horario);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const handleFormSuccess = () => {
        setShowModal(false);
        loadProcons();
    };

    return (
        <div className="procons-page">
            <button className="btn-back" onClick={() => navigate('/')}>
                ← Voltar ao Dashboard
            </button>

            <div className="procons-container">
                <div className="page-header">
                    <div className="header-left">
                        <h1>🏢 Unidades Procon</h1>
                        <p>Gerencie as unidades do Procon</p>
                    </div>
                    {canManageProcons && (
                        <button className="btn-primary" onClick={handleCreate}>
                            + Nova Unidade
                        </button>
                    )}
                </div>

                {/* Campo de busca */}
                <div className="search-container">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome, cidade ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="search-clear" onClick={() => setSearchTerm('')}>
                                ✕
                            </button>
                        )}
                    </div>
                    <div className="search-info">
                        {filteredProcons.length} de {procons.length} unidades
                    </div>
                </div>

                {/* Lista de Procons */}
                {isLoading ? (
                    <div className="loading">Carregando Procons...</div>
                ) : filteredProcons.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🏢</div>
                        <h3>Nenhuma unidade encontrada</h3>
                        <p>{searchTerm ? 'Tente outro termo de busca' : 'Clique em "Nova Unidade" para adicionar'}</p>
                    </div>
                ) : (
                    <div className="procons-grid">
                        {filteredProcons.map((procon) => (
                            <div key={procon.PROCON_ID} className={`procon-card ${!procon.ativo ? 'inactive' : ''}`}>
                                <div className="card-header">
                                    <div className="card-status">
                                        <span className={`status-badge ${procon.ativo ? 'status-active' : 'status-inactive'}`}>
                                            {procon.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <div className="card-title">
                                        <h3>{procon.nome}</h3>
                                        <p>{procon.cidade} - {procon.estado}</p>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="info-row">
                                        <span className="info-label">📍 Endereço:</span>
                                        <span className="info-value">{procon.endereco}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">📞 Telefone:</span>
                                        <span className="info-value">{procon.telefone}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">✉️ Email:</span>
                                        <span className="info-value">{procon.email}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">📱 WhatsApp:</span>
                                        <span className="info-value">{procon.whatsapp_number || 'Não cadastrado'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">🕐 Horário:</span>
                                        <span className="info-value">
                                            {formatarHorario(procon.horario_abertura)} às {formatarHorario(procon.horario_fechamento)}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">⏱️ Duração:</span>
                                        <span className="info-value">{procon.duracao_atendimento_minutos} minutos por atendimento</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">👥 Vagas:</span>
                                        <span className="info-value">{procon.vagas_por_horario} vagas por horário</span>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    {canManageProcons && (
                                        <>
                                            <button className="btn-edit" onClick={() => handleEdit(procon)}>
                                                ✏️ Editar
                                            </button>
                                            <button
                                                className={`btn-status ${procon.ativo ? 'btn-deactivate' : 'btn-activate'}`}
                                                onClick={() => handleToggleStatus(procon)}
                                            >
                                                {procon.ativo ? '🔴 Desativar' : '🟢 Ativar'}
                                            </button>
                                        </>
                                    )}
                                    {canDeleteProcon && (
                                        <button className="btn-delete" onClick={() => handleDelete(procon)}>
                                            🗑️ Excluir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <ProconForm
                    procon={selectedProcon}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};