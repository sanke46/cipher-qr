'use client'

import { useState, useEffect } from 'react'
import { decryptQRCode, getDisplayValue, type DecryptResult } from '@/lib/decrypt'
import { getHistory, saveToHistory, deleteFromHistory, clearHistory, type HistoryItem } from '@/lib/storage'
import HistoryPanel from '@/components/HistoryPanel'

const EXAMPLE_INPUT = `VW00012|Qdph=QE "Cehtdvgtehrri"|ShuvrqdoDff=40702810738360027199|EdqnQdph=FQE "Hrvgrqda Gehhyy"|ELF=044525225|FruuhvsDff=30101810400000000225|Sxusrvh=Efbqiq xq tbvaigetdvgtyu/092023/BH=3519008561/52271|Vxp=52271|shuvDff=3519008561|sdbpShulrg=092023|uhjWbsh=6|WhfkFrgh=02|SdbhhLQQ=7736520080|NSS=997650001`

export default function Home() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<DecryptResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Загружаем историю при монтировании
  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleDecrypt = () => {
    if (!input.trim()) return
    try {
      const decrypted = decryptQRCode(input)
      setResult(decrypted)

      // Сохраняем в историю
      saveToHistory(input, decrypted)
      setHistory(getHistory())
    } catch (e) {
      console.error('Decryption error:', e)
    }
  }

  const handleExample = () => {
    setInput(EXAMPLE_INPUT)
    setResult(null)
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleHistorySelect = (item: HistoryItem) => {
    setInput(item.encrypted)
    setResult(item.result)
  }

  const handleHistoryDelete = (id: string) => {
    deleteFromHistory(id)
    setHistory(getHistory())
  }

  const handleHistoryClear = () => {
    if (confirm('Очистить всю историю?')) {
      clearHistory()
      setHistory([])
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          CipherQR Decoder
        </h1>
        <p className="text-muted">
          Дешифровка зашифрованных платёжных QR-кодов
        </p>
      </header>

      {/* Input Section */}
      <div className="card mb-6">
        <textarea
          className="input-area"
          placeholder="Вставьте зашифрованную строку QR-кода..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            className="btn-primary"
            onClick={handleDecrypt}
            disabled={!input.trim()}
          >
            Расшифровать
          </button>
          <button className="btn-secondary" onClick={handleExample}>
            Пример
          </button>
          <button className="btn-secondary" onClick={handleClear}>
            Очистить
          </button>
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <div className="animate-fadeInUp">
          <h2 className="text-lg font-semibold mb-3">Результат</h2>

          {/* Raw Output */}
          <div className="card mb-4">
            <div className="flex items-start justify-between gap-2">
              <code className="text-sm break-all text-muted flex-1">
                {result.raw}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                title="Копировать"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Fields Table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 font-medium text-muted">Поле</th>
                  <th className="text-left py-2 font-medium text-muted">Значение</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4 text-accent">Формат</td>
                  <td className="py-2">{result.format}</td>
                </tr>
                {result.fields.map((field, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-4 text-accent">{field.name}</td>
                    <td className="py-2">{getDisplayValue(field.name, field.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Section */}
      <HistoryPanel
        history={history}
        onSelect={handleHistorySelect}
        onDelete={handleHistoryDelete}
        onClear={handleHistoryClear}
      />
    </main>
  )
}
