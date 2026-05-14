import { useState } from 'react';
import { userService, type User } from '../../../services/api/user.service';
import { showToast, showLoading, closeLoading } from '../../../utils/alert';
import './ResetPasswordModal.css';

interface ResetPasswordModalProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

export const ResetPasswordModal = ({ user, onClose, onSuccess }: ResetPasswordModalProps) => {
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (novaSenha.length < 6) {
            showToast('A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            showToast('As senhas não coincidem', 'error');
            return;
        }

        setIsLoading(true);
        showLoading('Resetando senha...');

        try {
            await userService.resetarSenha(user.USUARIO_ID, novaSenha);
            closeLoading();
            onSuccess();
            onClose();
        } catch (error: any) {
            closeLoading();
            console.error('Erro ao resetar senha:', error);
            showToast(error.message || 'Erro ao resetar senha', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container reset-modal">
                <div className="modal-header">
                    <h2>Resetar Senha</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="user-info">
                            <span className="user-icon">👤</span>
                            <div>
                                <p className="user-name">{user.nome}</p>
                                <p className="user-email">{user.email}</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nova Senha *</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    placeholder="Mínimo 6 caracteres"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Confirmar Senha *</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    placeholder="Confirme a nova senha"
                                />
                            </div>
                        </div>

                        {novaSenha && (
                            <div className="password-requirements">
                                <p>Requisitos:</p>
                                <ul>
                                    <li className={novaSenha.length >= 6 ? 'valid' : 'invalid'}>
                                        {novaSenha.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres
                                    </li>
                                    <li className={novaSenha === confirmarSenha && novaSenha !== '' ? 'valid' : 'invalid'}>
                                        {novaSenha === confirmarSenha && novaSenha !== '' ? '✓' : '○'} Senhas coincidentes
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Resetando...' : 'Resetar Senha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};