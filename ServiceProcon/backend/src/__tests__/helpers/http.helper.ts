// src/__tests__/helpers/http.helper.ts
import { createApp } from "../../app.test";
import request from "supertest";

const app = createApp();

export async function apiRequest(
  path: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
    query?: Record<string, string>;
  } = {},
): Promise<{ status: number; body: any }> {
  const { method = "GET", body, token, query } = options;

  let req =
    request(app)[
      method.toLowerCase() as "get" | "post" | "put" | "delete" | "patch"
    ](path);

  // Adicionar query parameters
  if (query) {
    req = req.query(query);
  }

  if (token) {
    req = req.set("Authorization", `Bearer ${token}`);
  }

  if (body) {
    req = req.send(body);
  }

  const response = await req;
  return { status: response.status, body: response.body };
}
