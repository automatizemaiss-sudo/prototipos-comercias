export const ADMIN_COOKIE = "silvia_admin";
// Protótipo: senha simples vinda do .env (fallback só para desenvolvimento local).
export const adminPassword = () => process.env.ADMIN_PASSWORD || "silvia123";
