import { usePermissions } from '../../hooks/usePermissions';
import './DashboardSidebar.css';

export const DashboardSidebar = () => {
  const { hasPermission, isRole } = usePermissions();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <a href="/" className="nav-item active">
          <span className="icon">📊</span>
          <span>Dashboard</span>
        </a>
        
        <a href="/atendimentos" className="nav-item">
          <span className="icon">💬</span>
          <span>Atendimentos</span>
        </a>
        
        {/* Menu apenas para quem tem permissão */}
        {hasPermission('canViewUsers') && (
          <a href="/usuarios" className="nav-item">
            <span className="icon">👥</span>
            <span>Usuários</span>
          </a>
        )}
        
        {hasPermission('canViewProcons') && (
          <a href="/procons" className="nav-item">
            <span className="icon">🏢</span>
            <span>Unidades Procon</span>
          </a>
        )}
        
        {hasPermission('canViewReports') && (
          <a href="/relatorios" className="nav-item">
            <span className="icon">📈</span>
            <span>Relatórios</span>
          </a>
        )}
        
        {hasPermission('canViewAuditLog') && (
          <a href="/auditoria" className="nav-item">
            <span className="icon">📝</span>
            <span>Auditoria</span>
          </a>
        )}
        
        {isRole('DEV') && (
          <a href="/dev" className="nav-item dev-tools">
            <span className="icon">🔧</span>
            <span>Dev Tools</span>
          </a>
        )}
      </nav>
    </aside>
  );
};