import { useState } from 'react';

import './FirstAccessModal.css';
import { apiService } from '../services/api/api';

interface FirstAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userNome: string;
}

export const FirstAccessModal = ({ isOpen, onClose, onSuccess, userNome }: FirstAccessModalProps) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiService.updateFirstAccessPassword(novaSenha, confirmarSenha);
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Erro ao atualizar senha');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container glass-panel fade-in-up">
        <div className="modal-header">
          <div className="logo-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9v4c0 3.87 3.13 7 7 7s7-3.13 7-7V9c0-3.87-3.13-7-7-7z" fill="currentColor"/>
              <path d="M12 22v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 11L12 14L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="modal-title">Primeiro Acesso</h2>
          <p className="modal-subtitle">Olá, <strong>{userNome}</strong>!</p>
        </div>

        <div className="modal-body">
          <p className="info-text">
            Por segurança, você precisa definir uma nova senha.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                id="novaSenha"
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder=" "
                disabled={isLoading}
              />
              <label htmlFor="novaSenha">Nova Senha</label>
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmarSenha"
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder=" "
                disabled={isLoading}
              />
              <label htmlFor="confirmarSenha">Confirmar Senha</label>
            </div>

            <div className="password-requirements">
              <ul>
                <li className={novaSenha.length >= 6 ? 'valid' : 'invalid'}>
                  <span className="check-icon">{novaSenha.length >= 6 ? '✓' : '○'}</span>
                  Mínimo de 6 caracteres
                </li>
                <li className={novaSenha === confirmarSenha && novaSenha !== '' ? 'valid' : 'invalid'}>
                  <span className="check-icon">{novaSenha === confirmarSenha && novaSenha !== '' ? '✓' : '○'}</span>
                  Senhas coincidentes
                </li>
              </ul>
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className={`login-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? <div className="spinner"></div> : 'Atualizar Senha'}
              </button>

              <button
                type="button"
                className="modal-button-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Sair
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};