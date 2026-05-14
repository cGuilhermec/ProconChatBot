interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  onClick?: () => void;
}

export const StatsCard = ({ title, value, icon, onClick }: StatsCardProps) => {
  return (
    <div className={`stats-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
};