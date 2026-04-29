export interface LoginInterface {
  id?: string;
  nome?: string;
  email: string;
  password: string;
  autenticate?: Promise<string | null>;
}
