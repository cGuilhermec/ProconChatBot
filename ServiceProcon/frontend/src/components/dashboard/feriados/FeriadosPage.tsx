import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { feriadoService, type Feriado } from '../../../services/api/feriado.service';
import { showConfirm, showToast, showLoading, closeLoading } from '../../../utils/alert';

import './FeriadosPage.css';
import { FeriadoForm } from './FeriadoForm';

export const FeriadosPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isAdmin } = usePermissions();
    const [feriados, setFeriados] = useState<Feriado[]>([]);
    const [filteredFeriados, setFilteredFeriados] = useState<Feriado[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedFeriado, setSelectedFeriado] = useState<Feriado | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFeriados();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredFeriados(feriados);
        } else {
            const filtered = feriados.filter(feriado =>
                feriado.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                formatarData(feriado.data).includes(searchTerm)
            );
            setFilteredFeriados(filtered);
        }
    }, [searchTerm, feriados]);

    const loadFeriados = async () => {
        try {
            setIsLoading(true);
            const data = await feriadoService.listarTodos(user?.procon_id);
            setFeriados(data);            
            setFilteredFeriados(data);
        } catch (error) {
            console.error('Erro ao carregar feriados:', error);
            showToast('Erro ao carregar lista de feriados', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedFeriado(null);
        setShowModal(true);
    };

    const handleEdit = (feriado: Feriado) => {
        setSelectedFeriado(feriado);
        setShowModal(true);
    };

    const handleDelete = async (feriado: Feriado) => {
        const confirmed = await showConfirm(
            'Excluir Feriado',
            `Tem certeza que deseja excluir o feriado "${feriado.nome}"?`,
            'Sim, excluir',
            'Cancelar'
        );

        if (!confirmed) return;

        showLoading('Excluindo feriado...');
        try {
            await feriadoService.excluir(feriado.FERIADO_ID);
            await loadFeriados();
            closeLoading();
            showToast('Feriado excluído com sucesso!', 'success');
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao excluir feriado:', error);
            showToast(error.message || 'Erro ao excluir feriado', 'error');
        }
    };

    const formatarData = (data: string) => {
      try {
        // Remove qualquer parte de hora se existir
        const dataPart = data.split("T")[0];
        const [ano, mes, dia] = dataPart.split("-");

        // Valida se os números são válidos
        if (!ano || !mes || !dia) return data;

        // Retorna no formato brasileiro
        return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
      } catch (error) {
        console.error("Erro ao formatar data:", error);
        return data;
      }
    };

    const getRecorrenteIcon = (recorrente: boolean) => {
        return recorrente ? '🔄' : '📅';
    };

    const getRecorrenteText = (recorrente: boolean) => {
        return recorrente ? 'Recorrente' : 'Data única';
    };

    const handleFormSuccess = () => {
        setShowModal(false);
        loadFeriados();
    };

    return (
        <div className="feriados-page">
            <button className="btn-back" onClick={() => navigate('/')}>
                ← Voltar ao Dashboard
            </button>

            <div className="feriados-container">
                <div className="page-header">
                    <div className="header-left">
                        <h1>📅 Feriados</h1>
                        <p>Gerencie os feriados do Procon</p>
                    </div>
                    {isAdmin && (
                        <button className="btn-primary" onClick={handleCreate}>
                            + Novo Feriado
                        </button>
                    )}
                </div>

                {/* Campo de busca */}
                <div className="search-container">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome do feriado ou data..."
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
                        {filteredFeriados.length} de {feriados.length} feriados
                    </div>
                </div>

                {/* Lista de Feriados */}
                {isLoading ? (
                    <div className="loading">Carregando feriados...</div>
                ) : filteredFeriados.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <h3>Nenhum feriado encontrado</h3>
                        <p>{searchTerm ? 'Tente outro termo de busca' : 'Clique em "Novo Feriado" para adicionar'}</p>
                    </div>
                ) : (
                    <div className="feriados-grid">
                                {filteredFeriados.map((feriado) => (
                            <div key={feriado.FERIADO_ID} className="feriado-card">
                                <div className="card-header">
                                    <div className="card-date">
                                        <span className="date-day">{formatarData(feriado.data).split('/')[0]}</span>
                                        <span className="date-month">{formatarData(feriado.data).split('/')[1]}</span>
                                    </div>
                                    <div className="card-info">
                                        <h3>{feriado.nome}</h3>
                                        <div className="card-meta">
                                            <span className={`recorrente-badge ${feriado.recorrente ? 'recorrente' : 'unico'}`}>
                                                {getRecorrenteIcon(feriado.recorrente)} {getRecorrenteText(feriado.recorrente)}
                                            </span>
                                            {feriado.procon && (
                                                <span className="procon-badge">🏢 {feriado.procon.nome}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="info-row">
                                        <span className="info-label">📅 Data completa:</span>
                                        <span className="info-value">{formatarData(feriado.data)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">📝 Cadastrado em:</span>
                                        <span className="info-value">
                                            {new Date(feriado.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="card-actions">
                                        <button className="btn-edit" onClick={() => handleEdit(feriado)}>
                                            ✏️ Editar
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDelete(feriado)}>
                                            🗑️ Excluir
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <FeriadoForm
                    feriado={selectedFeriado}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};