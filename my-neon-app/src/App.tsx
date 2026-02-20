import { useEffect, useMemo, useState } from 'react'
import { AuthView, SignedIn, SignedOut, UserButton } from '@neondatabase/neon-js/auth/react/ui'
import './App.css'

type CepResponse = {
  bairro?: string
  cep?: string
  erro?: boolean
  localidade?: string
  logradouro?: string
  uf?: string
}

type ApiRecord = {
  id: number
  cep: string
  logradouro: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  consultado_em: string
}

type ApiListResponse = {
  ok: boolean
  items?: ApiRecord[]
}

type ApiCreateResponse = {
  ok: boolean
  id?: number
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const API_ENDPOINT = `${API_BASE_URL}/api/cep-history.php`

function formatCepInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function normalizeCep(value: string): string {
  return value.replace(/\D/g, '')
}

function App() {
  const [cepInput, setCepInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<CepResponse | null>(null)
  const [history, setHistory] = useState<ApiRecord[]>([])

  const normalizedCep = useMemo(() => normalizeCep(cepInput), [cepInput])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`${API_ENDPOINT}?limit=10`)
        if (!response.ok) {
          throw new Error('Falha ao carregar historico')
        }

        const payload = (await response.json()) as ApiListResponse
        if (!payload.ok || !Array.isArray(payload.items)) {
          throw new Error('Resposta invalida da API')
        }

        setHistory(payload.items)
      } catch {
        setError('Nao foi possivel carregar o historico.')
      }
    }

    void loadHistory()
  }, [])

  const handleSearch = async () => {
    setError(null)
    setMessage(null)
    setAddress(null)

    if (normalizedCep.length !== 8) {
      setError('CEP invalido. Digite 8 numeros.')
      return
    }

    setLoading(true)
    try {
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`)
      if (!viaCepResponse.ok) {
        throw new Error('Erro ao consultar ViaCEP')
      }

      const viaCepData = (await viaCepResponse.json()) as CepResponse
      if (viaCepData.erro) {
        setError('CEP nao encontrado.')
        return
      }

      setAddress(viaCepData)

      const saveResponse = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: normalizedCep,
          logradouro: viaCepData.logradouro ?? null,
          bairro: viaCepData.bairro ?? null,
          cidade: viaCepData.localidade ?? null,
          estado: viaCepData.uf ?? null,
          fonte: 'viacep',
        }),
      })

      if (!saveResponse.ok) {
        throw new Error('Falha ao salvar historico')
      }

      const saved = (await saveResponse.json()) as ApiCreateResponse
      if (!saved.ok || typeof saved.id !== 'number') {
        throw new Error('Resposta invalida ao salvar historico')
      }

      const newRecord: ApiRecord = {
        id: saved.id,
        cep: normalizedCep,
        logradouro: viaCepData.logradouro ?? null,
        bairro: viaCepData.bairro ?? null,
        cidade: viaCepData.localidade ?? null,
        estado: viaCepData.uf ?? null,
        consultado_em: new Date().toISOString(),
      }

      setHistory((prev) => [newRecord, ...prev].slice(0, 10))
      setMessage('Consulta realizada e salva com sucesso.')
    } catch {
      setError('Erro ao consultar ou salvar CEP. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <SignedOut>
        <section className="card auth-card">
          <h1>Acesso</h1>
          <p>Entre com Neon Auth para consultar CEP e salvar historico.</p>
          <AuthView view="SIGN_IN" />
        </section>
      </SignedOut>

      <SignedIn>
        <section className="card">
          <div className="top-bar">
            <h1>Consulta CEP</h1>
            <UserButton />
          </div>

          <div className="input-row">
            <label htmlFor="cep-input">Digite o CEP:</label>
            <input
              id="cep-input"
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              value={cepInput}
              onChange={(event) => setCepInput(formatCepInput(event.target.value))}
              maxLength={9}
            />
          </div>

          <button type="button" onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>

          {message && <p className="status success">{message}</p>}
          {error && <p className="status error">{error}</p>}

          <div className="result">
            <h2>Resultado</h2>
            {!address && <p>Nenhuma consulta realizada ainda.</p>}
            {address && (
              <>
                <p>
                  <strong>Logradouro:</strong> {address.logradouro || '-'}
                </p>
                <p>
                  <strong>Bairro:</strong> {address.bairro || '-'}
                </p>
                <p>
                  <strong>Cidade:</strong> {address.localidade || '-'}
                </p>
                <p>
                  <strong>Estado:</strong> {address.uf || '-'}
                </p>
              </>
            )}
          </div>

          <div className="history">
            <h2>Ultimas consultas</h2>
            {history.length === 0 && <p>Sem historico disponivel.</p>}
            {history.length > 0 && (
              <ul>
                {history.map((item) => (
                  <li key={item.id}>
                    <span>{item.cep}</span>
                    <span>
                      {[item.logradouro, item.bairro, item.cidade, item.estado]
                        .filter(Boolean)
                        .join(' - ') || 'Sem endereco'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </SignedIn>
    </main>
  )
}

export default App
