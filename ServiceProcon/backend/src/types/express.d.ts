// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        nome: string;
        role: string;
        procon_id: number | null;
      };
    }
  }
}

// Para garantir que o arquivo é tratado como módulo
export {};
