// Configuração base da API
export const API_BASE_URL = 'http://localhost:3002';

interface LoginCredentials {
  email: string;
  senha: string;  // Mudado de password para senha
}

interface LoginResponse {
  sucesso: boolean;
  mensagem?: string;
  token?: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    role: string;
    procon_id: number;
    primeiro_acesso: boolean;
  };
}

interface FirstAccessData {
  novaSenha: string;
  confirmarSenha: string;
}

export const apiService = {
  // Método de login
  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; message?: string; token?: string; user?: any }> {
    try {
      console.log('Tentando login com:', credentials.email);
      console.log('URL da API:', `${API_BASE_URL}/login`);

      // Converte o formato para o que o backend espera
      const backendCredentials = {
        email: credentials.email,
        senha: credentials.password  // Mapeia password para senha
      };

      console.log('Enviando para o backend:', backendCredentials);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendCredentials),
      });

      console.log('Status da resposta:', response.status);

      const data = await response.json();
      console.log('Resposta do backend:', data);

      if (!response.ok) {
        throw new Error(data.mensagem || 'Erro ao fazer login');
      }

      // Verifica se o login foi bem sucedido
      if (data.sucesso && data.token) {
        // Armazena o token e dados do usuário
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));

        return {
          success: true,
          token: data.token,
          user: data.usuario,
          message: data.mensagem
        };
      } else {
        return {
          success: false,
          message: data.mensagem || 'Falha no login'
        };
      }
    } catch (error) {
      console.error('Erro detalhado na requisição de login:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao conectar com o servidor',
      };
    }

  },

  async updateFirstAccessPassword(novaSenha: string, confirmarSenha: string): Promise<{ success: boolean; message?: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const requestBody = {
        novaSenha: novaSenha,
        confirmarSenha: confirmarSenha
      };

      const response = await fetch(`${API_BASE_URL}/first-access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensagem || data.erro || 'Erro ao atualizar senha');
      }

      // Atualiza o usuário no localStorage
      const currentUser = this.getUser();
      if (currentUser) {
        currentUser.primeiro_acesso = false;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      return {
        success: true,
        message: data.mensagem || 'Senha atualizada com sucesso!'
      };
    } catch (error) {
      console.error('Erro na troca de senha:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao atualizar senha',
      };
    }
  },

  // Método para logout
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Método para verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Método para obter o token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Método para obter os dados do usuário
  getUser(): any | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};

