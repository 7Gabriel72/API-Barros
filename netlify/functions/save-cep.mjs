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
    const sql = neon();
    await sql`INSERT INTO pessoa (cep) VALUES (${cep})`;
    return response(200, { ok: true });
  } catch (error) {
    console.error("Erro ao salvar CEP:", error);
    return response(500, { ok: false, error: "Erro interno" });
  }
}
