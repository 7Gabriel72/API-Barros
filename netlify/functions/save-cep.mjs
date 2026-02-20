import { neon } from "@netlify/neon";

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return response(405, { ok: false, error: "Metodo nao permitido" });
  }

  let body;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return response(400, { ok: false, error: "JSON invalido" });
  }

  const cep = String(body?.cep ?? "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(cep)) {
    return response(400, { ok: false, error: "CEP invalido" });
  }

  try {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL_UNPOOLED;

    if (!connectionString) {
      return response(500, {
        ok: false,
        error: "Erro interno",
        detail: "Nenhuma string de conexao encontrada",
      });
    }

    const sql = neon(connectionString);
    await sql`
      CREATE TABLE IF NOT EXISTS pessoa (
        codigo_pessoa SERIAL PRIMARY KEY,
        cep CHAR(8) NOT NULL
      )
    `;
    await sql`INSERT INTO pessoa (cep) VALUES (${cep})`;
    return response(200, { ok: true });
  } catch (error) {
    console.error("Erro ao salvar CEP:", error);
    return response(500, {
      ok: false,
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
