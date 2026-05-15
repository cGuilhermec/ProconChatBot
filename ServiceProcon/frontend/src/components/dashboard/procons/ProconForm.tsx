import { useState } from 'react';
import { proconService, type Procon } from '../../../services/api/procon.service';
import { showToast, showLoading, closeLoading } from '../../../utils/alert';
import './ProconForm.css';

interface ProconFormProps {
    procon: Procon | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const ProconForm = ({ procon, onClose, onSuccess }: ProconFormProps) => {
    const [formData, setFormData] = useState({
        nome: procon?.nome || '',
        cidade: procon?.cidade || '',
        estado: procon?.estado || '',
        endereco: procon?.endereco || '',
        telefone: procon?.telefone || '',
        email: procon?.email || '',
        horario_abertura: procon?.horario_abertura ? new Date(procon.horario_abertura).toTimeString().slice(0, 5) : '08:00',
        horario_fechamento: procon?.horario_fechamento ? new Date(procon.horario_fechamento).toTimeString().slice(0, 5) : '17:00',
        duracao_atendimento_minutos: procon?.duracao_atendimento_minutos || 30,
        vagas_por_horario: procon?.vagas_por_horario || 2,
        whatsapp_number: procon?.whatsapp_number || '',
    });

    const [isLoading, setIsLoading] = useState(false);

    // Função para aplicar máscara de telefone fixo (10 dígitos)
    const maskPhone = (value: string) => {
        let numbers = value.replace(/\D/g, '');

        // Limita a 10 dígitos para telefone fixo
        if (numbers.length > 10) {
            numbers = numbers.slice(0, 10);
        }

        if (numbers.length <= 2) {
            return numbers;
        }
        if (numbers.length <= 6) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        }
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    };

    // Função para aplicar máscara de celular (11 dígitos)
    const maskCellphone = (value: string) => {
        let numbers = value.replace(/\D/g, '');

        // Limita a 11 dígitos para celular
        if (numbers.length > 11) {
            numbers = numbers.slice(0, 11);
        }

        if (numbers.length <= 2) {
            return numbers;
        }
        if (numbers.length <= 7) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        }
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    // Função genérica que detecta se é celular ou fixo baseado na quantidade de dígitos
    const maskPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');

        if (numbers.length === 0) return '';

        // Se tem 11 dígitos é celular, se tem 10 é fixo
        if (numbers.length <= 10) {
            return maskPhone(value);
        }
        return maskCellphone(value);
    };

    // Remove máscara para enviar ao backend (apenas números)
    const unmaskPhone = (value: string) => {
        return value.replace(/\D/g, '');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let newValue = value;

        // Aplica máscara para telefone e WhatsApp
        if (name === 'telefone' || name === 'whatsapp_number') {
            newValue = maskPhoneNumber(value);
        }

        setFormData({
            ...formData,
            [name]: newValue,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome.trim()) {
            showToast('Digite o nome do Procon', 'error');
            return;
        }

        if (!formData.cidade.trim()) {
            showToast('Digite a cidade', 'error');
            return;
        }

        setIsLoading(true);
        showLoading(procon ? 'Atualizando Procon...' : 'Criando Procon...');

        try {
            // Prepara os dados para envio (remove máscara dos telefones)
            const dataToSend = {
                ...formData,
                telefone: unmaskPhone(formData.telefone),
                whatsapp_number: formData.whatsapp_number ? unmaskPhone(formData.whatsapp_number) : '',
            };

            if (procon) {
                await proconService.atualizar(procon.PROCON_ID, dataToSend);
                showToast('Procon atualizado com sucesso!', 'success');
            } else {
                await proconService.criar(dataToSend);
                showToast('Procon criado com sucesso!', 'success');
            }
            closeLoading();
            onSuccess();
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao salvar Procon:', error);
            showToast(error.message || 'Erro ao salvar Procon', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const estados = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-container procon-modal">
                <div className="modal-header">
                    <h2>{procon ? '✏️ Editar Procon' : '➕ Nova Unidade Procon'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label>Nome do Procon *</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    placeholder="Ex: Procon São Paulo"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label>Cidade *</label>
                                <input
                                    type="text"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    placeholder="Ex: São Paulo"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label>Estado *</label>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                >
                                    <option value="">Selecione</option>
                                    {estados.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Endereço *</label>
                            <input
                                type="text"
                                name="endereco"
                                value={formData.endereco}
                                onChange={handleChange}
                                placeholder="Ex: Av. Paulista, 1234"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Telefone *</label>
                                <input
                                    type="tel"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    placeholder="(11) 9999-9999 ou (11) 99999-9999"
                                    required
                                    disabled={isLoading}
                                />
                                <small className="input-hint">Formato: (DD) 9999-9999 (fixo) ou (DD) 99999-9999 (celular)</small>
                            </div>
                            <div className="form-group">
                                <label>WhatsApp</label>
                                <input
                                    type="tel"
                                    name="whatsapp_number"
                                    value={formData.whatsapp_number}
                                    onChange={handleChange}
                                    placeholder="(11) 99999-9999"
                                    disabled={isLoading}
                                />
                                <small className="input-hint">Formato: (DD) 99999-9999 (celular)</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="procon@cidade.gov.br"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Horário de Abertura *</label>
                                <input
                                    type="time"
                                    name="horario_abertura"
                                    value={formData.horario_abertura}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label>Horário de Fechamento *</label>
                                <input
                                    type="time"
                                    name="horario_fechamento"
                                    value={formData.horario_fechamento}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Duração do Atendimento (min) *</label>
                                <input
                                    type="number"
                                    name="duracao_atendimento_minutos"
                                    value={formData.duracao_atendimento_minutos}
                                    onChange={handleChange}
                                    min="15"
                                    max="120"
                                    step="15"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label>Vagas por Horário *</label>
                                <input
                                    type="number"
                                    name="vagas_por_horario"
                                    value={formData.vagas_por_horario}
                                    onChange={handleChange}
                                    min="1"
                                    max="10"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : procon ? 'Atualizar' : 'Criar Procon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};