import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { perguntaService, type Pergunta } from '../../../services/api/pergunta.service';
import { showToast, showLoading, closeLoading } from '../../../utils/alert';
import './PerguntaForm.css';

interface PerguntaFormProps {
    pergunta: Pergunta | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const PerguntaForm = ({ pergunta, onClose, onSuccess }: PerguntaFormProps) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        tema: pergunta?.tema || '',
        pergunta: pergunta?.pergunta || '',
        resposta: pergunta?.resposta || '',
        observacao: pergunta?.observacao || '',
        base_legal: pergunta?.base_legal || '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.tema.trim()) {
            showToast('Digite o tema da pergunta', 'error');
            return;
        }

        if (!formData.pergunta.trim()) {
            showToast('Digite a pergunta', 'error');
            return;
        }

        if (!formData.resposta.trim()) {
            showToast('Digite a resposta', 'error');
            return;
        }

        setIsLoading(true);
        showLoading(pergunta ? 'Atualizando pergunta...' : 'Criando pergunta...');

        try {
            const dataToSend = {
                procon_id: user?.procon_id || 1,
                tema: formData.tema.trim(),
                pergunta: formData.pergunta.trim(),
                resposta: formData.resposta.trim(),
                observacao: formData.observacao.trim() || undefined,
                base_legal: formData.base_legal || undefined,
            };

            if (pergunta) {
                await perguntaService.atualizar(pergunta.Pergunta_ID, dataToSend);
                showToast('Pergunta atualizada com sucesso!', 'success');
            } else {
                await perguntaService.criar(dataToSend);
                showToast('Pergunta criada com sucesso!', 'success');
            }
            closeLoading();
            onSuccess();
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao salvar pergunta:', error);
            showToast(error.message || 'Erro ao salvar pergunta', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container pergunta-modal">
                <div className="modal-header">
                    <h2>{pergunta ? '✏️ Editar Pergunta' : '➕ Nova Pergunta'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Tema *</label>
                            <input
                                type="text"
                                name="tema"
                                value={formData.tema}
                                onChange={handleChange}
                                placeholder="Ex: Horário de Funcionamento"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Pergunta *</label>
                            <textarea
                                name="pergunta"
                                value={formData.pergunta}
                                onChange={handleChange}
                                placeholder="Digite a pergunta que o usuário fará..."
                                rows={3}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Resposta *</label>
                            <textarea
                                name="resposta"
                                value={formData.resposta}
                                onChange={handleChange}
                                placeholder="Digite a resposta para esta pergunta..."
                                rows={5}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Base Legal (opcional)</label>
                            <textarea
                                name="base_legal"
                                value={formData.base_legal}
                                onChange={handleChange}
                                placeholder="Informe a base legal (leis, artigos, etc.)..."
                                rows={3}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Observação (opcional - visível apenas para administradores)</label>
                            <textarea
                                name="observacao"
                                value={formData.observacao}
                                onChange={handleChange}
                                placeholder="Observações internas sobre esta pergunta..."
                                rows={2}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-hint">
                            <p>ℹ️ Perguntas que contiverem palavras sensíveis serão automaticamente enviadas para revisão.</p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : pergunta ? 'Atualizar' : 'Criar Pergunta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};