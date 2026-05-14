
import type { Module } from '../../../types/modules';
import './ModuleCard.css';

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
}

export const ModuleCard = ({ module, onClick }: ModuleCardProps) => {
  return (
    <div className="module-card glass-panel" onClick={onClick}>
      <div className="module-icon">{module.icon}</div>
      <div className="module-content">
        <h3>{module.name}</h3>
        <p>{module.description}</p>
      </div>
      <div className="module-arrow">→</div>
    </div>
  );
};