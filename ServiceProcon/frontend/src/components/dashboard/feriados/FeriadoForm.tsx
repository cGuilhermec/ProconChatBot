import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { feriadoService, type Feriado } from '../../../services/api/feriado.service';
import { showToast, showLoading, closeLoading } from '../../../utils/alert';
import './FeriadoForm.css';

interface FeriadoFormProps {
    feriado: Feriado | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const FeriadoForm = ({ feriado, onClose, onSuccess }: FeriadoFormProps) => {
    const { user } = useAuth();
    const [nome, setNome] = useState(feriado?.nome || '');
    const [data, setData] = useState(() => {
        if (feriado?.data) {
            const date = new Date(feriado.data);
            return date.toISOString().split('T')[0];
        }
        return '';
    });
    const [recorrente, setRecorrente] = useState(feriado?.recorrente || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nome.trim()) {
            showToast('Digite o nome do feriado', 'error');
            return;
        }

        if (!data) {
            showToast('Selecione a data do feriado', 'error');
            return;
        }

        setIsLoading(true);
        showLoading(feriado ? 'Atualizando feriado...' : 'Criando feriado...');

        try {
            if (feriado) {
                await feriadoService.atualizar(feriado.FERIADO_ID, {
                    nome: nome.trim(),
                    data,
                    recorrente,
                });
                showToast('Feriado atualizado com sucesso!', 'success');
            } else {
                await feriadoService.criar({
                    procon_id: user?.procon_id || 1,
                    nome: nome.trim(),
                    data,
                    recorrente,
                });
                showToast('Feriado criado com sucesso!', 'success');
            }
            closeLoading();
            onSuccess();
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao salvar feriado:', error);
            showToast(error.message || 'Erro ao salvar feriado', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container feriado-modal">
                <div className="modal-header">
                    <h2>{feriado ? '✏️ Editar Feriado' : '➕ Novo Feriado'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Nome do Feriado *</label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Natal, Ano Novo, Carnaval..."
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Data *</label>
                            <input
                                type="date"
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={recorrente}
                                    onChange={(e) => setRecorrente(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span>Feriado recorrente (ocorre todo ano nesta data)</span>
                            </label>
                            <small className="checkbox-hint">
                                {recorrente
                                    ? 'Este feriado será considerado todo ano na mesma data'
                                    : 'Este feriado será considerado apenas para o ano selecionado'}
                            </small>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : feriado ? 'Atualizar' : 'Criar Feriado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};