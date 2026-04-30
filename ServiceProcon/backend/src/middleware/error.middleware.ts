// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err.message === "Procon não encontrado") {
    return res.status(404).json({
      sucesso: false,
      erro: err.message,
      mensagem: "Recurso não encontrado",
    });
  }

  if (err.message.includes("não tem permissão")) {
    return res.status(403).json({
      sucesso: false,
      erro: err.message,
    });
  }

  return res.status(500).json({
    sucesso: false,
    erro: err.message,
    mensagem: "Erro interno no servidor",
  });
};
