import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './ProfilePage.css';
import { useAuth } from '../../context/AuthContext';
import { profileService, type ProfileData } from '../../services/api/profile.service';
import { closeLoading, showConfirm, showLoading } from '../../utils/alert';

export const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const data = await profileService.getMe();
            setProfile(data);
        } catch (err) {
            console.error('Erro ao carregar perfil:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (novaSenha.length < 6) {
            showConfirm('Erro', 'A nova senha deve ter no mínimo 6 caracteres', 'OK', '');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            showConfirm('Erro', 'As senhas não coincidem', 'OK', '');
            return;
        }

        const confirmed = await showConfirm(
            'Alterar Senha',
            'Tem certeza que deseja alterar sua senha?',
            'Sim, alterar',
            'Cancelar'
        );

        if (!confirmed) return;

        showLoading('Alterando senha...');
        try {
            await profileService.mudarSenha(senhaAtual, novaSenha);
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');
            closeLoading();
            showConfirm('Sucesso', 'Senha alterada com sucesso!', 'OK', '');
        } catch (err: any) {
            closeLoading();
            console.error('Erro ao alterar senha:', err);
            showConfirm('Erro', err.message || 'Erro ao alterar senha', 'OK', '');
        }
    };

    const getRoleName = (role: string) => {
        const roles: Record<string, string> = {
            DEV: 'Desenvolvedor',
            DIRETOR: 'Diretor',
            COORDENADOR: 'Coordenador',
            FUNCIONARIO: 'Funcionário',
        };
        return roles[role] || role;
    };

    const getRoleBadgeClass = (role: string) => {
        const classes: Record<string, string> = {
            DEV: 'badge-dev',
            DIRETOR: 'badge-diretor',
            COORDENADOR: 'badge-coordenador',
            FUNCIONARIO: 'badge-funcionario',
        };
        return classes[role] || 'badge-default';
    };

    if (isLoading && !profile) {
        return (
            <div className="profile-page">
                <div className="loading">Carregando perfil...</div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <button className="btn-back" onClick={() => navigate('/')}>
                ← Voltar ao Dashboard
            </button>

            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {profile?.role === 'DEV' && '🚀'}
                        {profile?.role === 'DIRETOR' && '👑'}
                        {profile?.role === 'COORDENADOR' && '📋'}
                        {profile?.role === 'FUNCIONARIO' && '👤'}
                    </div>
                    <div className="profile-info">
                        <h1>{profile?.nome}</h1>
                        <p className="profile-email">{profile?.email}</p>
                        <span className={`badge ${getRoleBadgeClass(profile?.role || '')}`}>
                            {getRoleName(profile?.role || '')}
                        </span>
                    </div>
                </div>

                <div className="profile-section">
                    <div className="section-header">
                        <h2>🔒 Alterar Senha</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="profile-form">
                        <div className="form-group">
                            <label>Senha atual</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={senhaAtual}
                                    onChange={(e) => setSenhaAtual(e.target.value)}
                                    required
                                    placeholder="Digite sua senha atual"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nova senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    required
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Confirmar nova senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    required
                                    placeholder="Confirme a nova senha"
                                />
                            </div>
                        </div>

                        {/* Requisitos da senha */}
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

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                />
                                Mostrar senhas
                            </label>
                        </div>

                        <button type="submit" className="btn-primary">
                            Alterar Senha
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};