// src/app.ts (servidor separado para testes e produção)
import express from "express";
import cors from "cors";
import Routes from "./routes/index.routes";

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/", Routes);
  return app;
};
