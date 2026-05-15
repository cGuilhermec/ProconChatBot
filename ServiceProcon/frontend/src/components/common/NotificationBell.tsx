import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificacaoService, type Notificacao } from '../../services/api/notificacao.service';
import './NotificationBell.css';

export const NotificationBell = () => {
    const navigate = useNavigate();
    const [count, setCount] = useState(0);
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadCount();
        const interval = setInterval(loadCount, 30000); // Atualiza a cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadNotificacoes();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadCount = async () => {
        try {
            const total = await notificacaoService.contarNaoLidas();
            setCount(total);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };

    const loadNotificacoes = async () => {
        try {
            const data = await notificacaoService.minhasNotificacoes(true);
            setNotificacoes(data.slice(0, 10));
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificacaoService.marcarComoLida(id);
            setNotificacoes(prev => prev.filter(n => n.NOTIFICACAO_ID !== id));
            setCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar como lida:', error);
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        navigate('/notificacoes');
    };

    const handleGoToPergunta = (perguntaId: number) => {
        setIsOpen(false);
        navigate(`/perguntas/${perguntaId}/revisar`);
    };

    const getTipoIcon = (tipo: string) => {
        const icons: Record<string, string> = {
            PENDENTE_REVISAO: '⏳',
            REVISAO_URGENTE: '⚠️',
            PERGUNTA_APROVADA: '✅',
            PERGUNTA_REPROVADA: '❌',
            PERGUNTA_BLOQUEADA: '🔒',
        };
        return icons[tipo] || '📌';
    };

    const getTipoClass = (tipo: string) => {
        const classes: Record<string, string> = {
            PENDENTE_REVISAO: 'notification-pending',
            REVISAO_URGENTE: 'notification-urgent',
            PERGUNTA_APROVADA: 'notification-approved',
            PERGUNTA_REPROVADA: 'notification-rejected',
            PERGUNTA_BLOQUEADA: 'notification-blocked',
        };
        return classes[tipo] || '';
    };

    return (
        <div className="notification-bell" ref={dropdownRef}>
            <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
                🔔
                {count > 0 && <span className="bell-badge">{count > 99 ? '99+' : count}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notificações</h3>
                        {notificacoes.length > 0 && (
                            <button className="view-all" onClick={handleViewAll}>
                                Ver todas
                            </button>
                        )}
                    </div>
                    <div className="notification-list">
                        {notificacoes.length === 0 ? (
                            <div className="notification-empty">
                                <span>🔔</span>
                                <p>Nenhuma notificação</p>
                            </div>
                        ) : (
                            notificacoes.map(notif => (
                                <div
                                    key={notif.NOTIFICACAO_ID}
                                    className={`notification-item ${getTipoClass(notif.tipo)}`}
                                    onClick={() => handleGoToPergunta(notif.pergunta_id)}
                                >
                                    <div className="notification-icon">
                                        {getTipoIcon(notif.tipo)}
                                    </div>
                                    <div className="notification-content">
                                        <p>{notif.mensagem}</p>
                                        <small>
                                            {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </small>
                                    </div>
                                    <button
                                        className="notification-close"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(notif.NOTIFICACAO_ID);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};