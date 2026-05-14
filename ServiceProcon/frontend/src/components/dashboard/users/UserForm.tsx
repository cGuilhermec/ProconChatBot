import { useState, useEffect } from 'react';
import { userService, type User } from '../../../services/api/user.service';
import { proconService, type Procon } from '../../../services/api/procon.service';
import { meService, type Me } from '../../../services/api/me.service';
import './UserForm.css';
import { showToast } from '../../../utils/alert';

interface UserFormProps {
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserForm = ({ user, onClose, onSuccess }: UserFormProps) => {
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'FUNCIONARIO');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [proconId, setProconId] = useState<number>(0);
  const [procons, setProcons] = useState<Procon[]>([]);
  const [currentUser, setCurrentUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProcons, setIsLoadingProcons] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Define quais roles podem ser selecionadas baseado na role do usuário logado
  useEffect(() => {
    if (currentUser) {
      const rolesByUserRole: Record<string, string[]> = {
        FUNCIONARIO: ['FUNCIONARIO'], // Funcionário só pode criar funcionário
        COORDENADOR: ['FUNCIONARIO', 'COORDENADOR'], // Coordenador pode criar funcionário e coordenador
        DIRETOR: ['FUNCIONARIO', 'COORDENADOR', 'DIRETOR'], // Diretor pode criar funcionário, coordenador e diretor
        DEV: ['FUNCIONARIO', 'COORDENADOR', 'DIRETOR', 'DEV'], // DEV pode criar qualquer role
      };
      
      setAvailableRoles(rolesByUserRole[currentUser.role] || ['FUNCIONARIO']);
      
      // Se a role atual não está disponível para seleção, muda para a primeira disponível
      if (!rolesByUserRole[currentUser.role]?.includes(role)) {
        setRole(rolesByUserRole[currentUser.role]?.[0] || 'FUNCIONARIO');
      }
    }
  }, [currentUser, role]);

  // Carrega os dados do usuário logado e a lista de procons
  useEffect(() => {
    loadCurrentUserAndProcons();
  }, []);

  // Quando o role mudar, ajusta o comportamento do procon_id
  useEffect(() => {
    if (currentUser) {
      if (role === 'COORDENADOR' || role === 'FUNCIONARIO') {
        // Coordenador e Funcionário usam o mesmo procon do usuário logado
        setProconId(currentUser.procon_id);
      } else if (role === 'DIRETOR' || role === 'DEV') {
        // Diretor/DEV pode escolher entre todos os procons
        if (procons.length > 0 && proconId === 0) {
          setProconId(procons[0].PROCON_ID);
        }
      }
    }
  }, [role, currentUser, procons]);

  const loadCurrentUserAndProcons = async () => {
    try {
      // Busca dados do usuário logado
      const me = await meService.getMe();
      setCurrentUser(me);
      
      // Se for DIRETOR ou DEV, busca lista de procons
      if (me.role === 'DIRETOR' || me.role === 'DEV') {
        setIsLoadingProcons(true);
        const proconsList = await proconService.listarTodos();
        setProcons(proconsList);
        if (proconsList.length > 0) {
          setProconId(proconsList[0].PROCON_ID);
        }
        setIsLoadingProcons(false);
      } else {
        // Para COORDENADOR e FUNCIONARIO, usa o procon_id do usuário logado
        setProconId(me.procon_id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (user) {
        // Atualizar usuário existente
        await userService.atualizar(user.USUARIO_ID, { nome, email, role });
        showToast('Usuário atualizado com sucesso!', 'success');
      } else {
        // Criar novo usuário
        if (!senha) {
          showToast('Senha é obrigatória para criar um novo usuário', 'error');
          setIsLoading(false);
          return;
        }
        
        if (senha !== confirmarSenha) {
          showToast('As senhas não coincidem', 'error');
          setIsLoading(false);
          return;
        }
        
        if (senha.length < 6) {
          showToast('A senha deve ter no mínimo 6 caracteres', 'error');
          setIsLoading(false);
          return;
        }

        // Valida se o procon_id está selecionado
        if (!proconId || proconId === 0) {
          showToast('Selecione uma unidade Procon', 'error');
          setIsLoading(false);
          return;
        }

        await userService.criar({ 
          nome, 
          email, 
          senha, 
          role, 
          procon_id: proconId 
        });
        showToast('Usuário criado com sucesso!', 'success');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Erro:', error);
      showToast(error.message || (user ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Verifica se deve mostrar o selector de procon
  const shouldShowProconSelector = () => {
    return !user && (role === 'DIRETOR' || role === 'DEV') && procons.length > 0;
  };

  // Mapeia as roles para nomes amigáveis
  const getRoleLabel = (roleValue: string) => {
    const labels: Record<string, string> = {
      FUNCIONARIO: 'Funcionário',
      COORDENADOR: 'Coordenador',
      DIRETOR: 'Diretor',
      DEV: 'Desenvolvedor',
    };
    return labels[roleValue] || roleValue;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Digite o nome completo"
              />
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="usuario@procon.com"
              />
            </div>
            
            <div className="form-group">
              <label>Perfil *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {getRoleLabel(r)}
                  </option>
                ))}
              </select>
              {currentUser && (
                <small className="role-hint">
                  {currentUser.role === 'COORDENADOR' && 'Coordenadores podem criar: Funcionários e Coordenadores'}
                  {currentUser.role === 'DIRETOR' && 'Diretores podem criar: Funcionários, Coordenadores e Diretores'}
                  {currentUser.role === 'DEV' && 'Desenvolvedores podem criar todos os perfis'}
                  {currentUser.role === 'FUNCIONARIO' && 'Funcionários podem criar apenas outros funcionários'}
                </small>
              )}
            </div>

            {/* Selector de Procon - Apenas para DIRETOR/DEV */}
            {shouldShowProconSelector() && (
              <div className="form-group">
                <label>Unidade Procon *</label>
                {isLoadingProcons ? (
                  <div className="loading-procons">Carregando unidades...</div>
                ) : (
                  <select
                    value={proconId}
                    onChange={(e) => setProconId(Number(e.target.value))}
                    required
                    disabled={isLoading}
                  >
                    {procons.map((procon) => (
                      <option key={procon.PROCON_ID} value={procon.PROCON_ID}>
                        {procon.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Campos de senha - só aparecem quando é criação de novo usuário */}
            {!user && (
              <>
                <div className="form-group">
                  <label>Senha *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Mínimo 6 caracteres"
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
                      placeholder="Confirme a senha"
                    />
                  </div>
                </div>

                {/* Requisitos da senha */}
                {senha && (
                  <div className="password-requirements">
                    <p>Requisitos:</p>
                    <ul>
                      <li className={senha.length >= 6 ? 'valid' : 'invalid'}>
                        {senha.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres
                      </li>
                      <li className={senha === confirmarSenha && senha !== '' ? 'valid' : 'invalid'}>
                        {senha === confirmarSenha && senha !== '' ? '✓' : '○'} Senhas coincidentes
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : user ? 'Salvar' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};