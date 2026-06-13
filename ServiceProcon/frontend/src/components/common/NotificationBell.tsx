import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { perguntaService, type Pergunta } from '../../services/api/pergunta.service';
import './NotificationBell.css';

export const NotificationBell = () => {
    const navigate = useNavigate();
    const [count, setCount] = useState(0);
    const [notificacoes, setNotificacoes] = useState<Pergunta[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadCount();
        const interval = setInterval(loadCount, 30000);
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

    // Busca perguntas pendentes
    const loadCount = async () => {
        try {
            const data = await perguntaService.listarPendentes();
            console.log('🔔 Perguntas pendentes:', data.length);
            setCount(data.length);
        } catch (error) {
            console.error('Erro ao carregar perguntas pendentes:', error);
        }
    };

    const loadNotificacoes = async () => {
        try {
            const data = await perguntaService.listarPendentes();
            setNotificacoes(data.slice(0, 10));
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };

    const handleClick = (perguntaId: number) => {
        setIsOpen(false);
        navigate(`/perguntas`);
    };

    const formatarData = (data: string) => {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                        <h3>Perguntas para Revisão</h3>
                        {count === 0 && (
                            <span className="empty-badge">Tudo revisado!</span>
                        )}
                    </div>
                    <div className="notification-list">
                        {notificacoes.length === 0 ? (
                            <div className="notification-empty">
                                <span>✅</span>
                                <p>Nenhuma pergunta pendente</p>
                            </div>
                        ) : (
                            notificacoes.map(notif => (
                                <div
                                    key={notif.Pergunta_ID}
                                    className="notification-item notification-pending"
                                    onClick={() => handleClick(notif.Pergunta_ID)}
                                >
                                    <div className="notification-icon">📋</div>
                                    <div className="notification-content">
                                        <p><strong>{notif.tema}</strong></p>
                                        <p className="notification-message">{notif.pergunta.substring(0, 80)}...</p>
                                        <small>
                                            Criado por: {notif.criador?.nome || '—'} • {formatarData(notif.created_at)}
                                        </small>
                                        {notif.palavras_detectadas && notif.palavras_detectadas.length > 0 && (
                                            <div className="notification-palavras">
                                                ⚠️ Palavras: {notif.palavras_detectadas.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="notification-arrow">→</div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="notification-footer">
                        <button onClick={() => navigate('/perguntas')}>
                            Ver todas as perguntas pendentes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};