CREATE TABLE IF NOT EXISTS cep_history (
  id BIGSERIAL PRIMARY KEY,
  cep CHAR(8) NOT NULL,
  logradouro VARCHAR(255),
  bairro VARCHAR(255),
  cidade VARCHAR(120),
  estado CHAR(2),
  fonte VARCHAR(20) NOT NULL DEFAULT 'viacep',
  consultado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cep_history_consultado_em
  ON cep_history (consultado_em DESC);

CREATE INDEX IF NOT EXISTS idx_cep_history_cep
  ON cep_history (cep);
