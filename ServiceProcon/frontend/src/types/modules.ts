import type { JSX } from "react";
import type { UserRole } from "./roles";


export interface Module {
    id: string;
    name: string;
    description: string;
    icon: string;
    path: string;
    permissions: UserRole[];
    component?: React.LazyExoticComponent<() => JSX.Element>;
}

export const modules: Module[] = [
    // {
    //     id: 'dashboard',
    //     name: 'Dashboard',
    //     description: 'Visão geral do sistema',
    //     icon: '📊',
    //     path: '/dashboard',
    //     permissions: ['FUNCIONARIO', 'COORDENADOR', 'DIRETOR', 'DEV'],
    // },
    {
        id: 'users',
        name: 'Usuários',
        description: 'Gerenciar usuários do sistema',
        icon: '👥',
        path: '/usuarios',
        permissions: ['COORDENADOR', 'DIRETOR', 'DEV'],
    },
    {
        id: 'profile',
        name: 'Meu Perfil',
        description: 'Alterar senha e dados pessoais',
        icon: '👤',
        path: '/perfil',
        permissions: ['FUNCIONARIO', 'COORDENADOR', 'DIRETOR', 'DEV'],
    },
    {
        id: 'procons',
        name: 'Unidades Procon',
        description: 'Gerenciar unidades Procon',
        icon: '🏢',
        path: '/procons',
        permissions: ['DIRETOR', 'DEV'],
    },
    {
        id: 'feriados',
        name: 'Feriados',
        description: 'Configurar feriados e datas especiais',
        icon: '📅',
        path: '/feriados',
        permissions: ['COORDENADOR', 'DIRETOR', 'DEV'],
    },
    {
        id: 'perguntas',
        name: 'Perguntas Frequentes',
        description: 'Gerenciar FAQ do chatbot',
        icon: '❓',
        path: '/perguntas',
        permissions: ['FUNCIONARIO', 'COORDENADOR', 'DIRETOR', 'DEV'],
    },
    {
        id: 'agendamentos',
        name: 'Agendamentos',
        description: 'Gerenciar agendamentos',
        icon: '📆',
        path: '/agendamentos',
        permissions: ['FUNCIONARIO', 'COORDENADOR', 'DIRETOR', 'DEV'],
    },
    {
        id: 'auditlog',
        name: 'Auditoria',
        description: 'Logs de atividades do sistema',
        icon: '📝',
        path: '/auditoria',
        permissions: ['COORDENADOR', 'DIRETOR', 'DEV'],
    },
    {
        id: 'devtools',
        name: 'Dev Tools',
        description: 'Ferramentas para desenvolvedores',
        icon: '🔧',
        path: '/dev',
        permissions: ['DEV'],
    },
];