'use client'

import { useState, useEffect } from 'react'
import { decryptQRCode, getDisplayValue, encryptQRCode, type DecryptResult } from '@/lib/decrypt'
import { getHistory, saveToHistory, deleteFromHistory, clearHistory, formatHistoryDate, type HistoryItem } from '@/lib/storage'
import { formatSum } from '@/lib/decrypt'

export default function Home() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<DecryptResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)

  useEffect(() => {
    setHistory(getHistory())
    setIsLoaded(true)
  }, [])

  const handleDecrypt = async () => {
    if (!input.trim()) return
    setIsDecrypting(true)
    try {
      const decrypted = await decryptQRCode(input)
      setResult(decrypted)
      saveToHistory(input, decrypted)
      setHistory(getHistory())
    } catch (e) {
      console.error('Decryption error:', e)
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleClear = () => {
    setInput('')
    setResult(null)
  }

  const handleEncrypt = () => {
    if (!input.trim()) return
    const encrypted = encryptQRCode(input)
    const encryptResult = {
      format: 'Зашифровано',
      fields: [],
      raw: encrypted
    }
    setResult(encryptResult)
    saveToHistory(input, encryptResult, 'encrypt')
    setHistory(getHistory())
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
    setMobileMenuOpen(false)
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10" />
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">ПиП QR-Decoder</h1>
            <p className="text-sm text-muted">Дешифровка платёжных QR-кодов</p>
          </div>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Открыть историю"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile History Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l border-white/10 shadow-2xl animate-slideIn">
            <div className="p-4 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h2 className="font-semibold">История</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {history.length > 0 && (
                <button
                  onClick={handleHistoryClear}
                  className="text-xs text-muted hover:text-error transition-colors mb-3 self-start"
                >
                  Очистить всю историю
                </button>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {!isLoaded ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 rounded-xl bg-background/50 animate-pulse">
                        <div className="h-3 w-24 bg-white/10 rounded mb-2"></div>
                        <div className="h-4 w-32 bg-white/10 rounded mb-1"></div>
                        <div className="h-4 w-20 bg-white/10 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2 opacity-50">📋</div>
                    <p className="text-muted text-sm">История пуста</p>
                    <p className="text-muted/50 text-xs mt-1">Расшифрованные QR-коды<br/>появятся здесь</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-background/50 cursor-pointer hover:bg-background transition-all group"
                        onClick={() => handleHistorySelect(item)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Бейдж действия */}
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            item.actionType === 'encrypt'
                              ? 'bg-[#3E81F3]/15 border border-[#3E81F3]/30 text-[#3E81F3]'
                              : 'bg-gradient-to-br from-[#6DA3FF] to-[#1C68EA] text-white'
                          }`}>
                            {item.actionType === 'encrypt' ? 'З' : 'Р'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted mb-1">
                              {formatHistoryDate(item.timestamp)}
                            </div>
                            <div className="text-sm truncate">{item.displayName}</div>
                            {item.displaySum && (
                              <div className="text-accent font-medium text-sm">
                                {formatSum(item.displaySum)}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleHistoryDelete(item.id)
                            }}
                            className="p-1 rounded hover:bg-error/20 transition-all"
                            title="Удалить"
                          >
                            <svg className="w-3.5 h-3.5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - History (desktop only) */}
          <aside className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <div className="card p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <h2 className="font-semibold">История</h2>
                  {history.length > 0 && (
                    <button
                      onClick={handleHistoryClear}
                      className="text-xs text-muted hover:text-error transition-colors"
                    >
                      Очистить
                    </button>
                  )}
                </div>

                {/* Content */}
                {!isLoaded ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 rounded-xl bg-background/50 animate-pulse">
                        <div className="h-3 w-24 bg-white/10 rounded mb-2"></div>
                        <div className="h-4 w-32 bg-white/10 rounded mb-1"></div>
                        <div className="h-4 w-20 bg-white/10 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2 opacity-50">📋</div>
                    <p className="text-muted text-sm">История пуста</p>
                    <p className="text-muted/50 text-xs mt-1">Расшифрованные QR-коды<br/>появятся здесь</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-background/50 cursor-pointer hover:bg-background transition-all group"
                        onClick={() => handleHistorySelect(item)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Бейдж действия */}
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            item.actionType === 'encrypt'
                              ? 'bg-[#3E81F3]/15 border border-[#3E81F3]/30 text-[#3E81F3]'
                              : 'bg-gradient-to-br from-[#6DA3FF] to-[#1C68EA] text-white'
                          }`}>
                            {item.actionType === 'encrypt' ? 'З' : 'Р'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted mb-1">
                              {formatHistoryDate(item.timestamp)}
                            </div>
                            <div className="text-sm truncate">{item.displayName}</div>
                            {item.displaySum && (
                              <div className="text-accent font-medium text-sm">
                                {formatSum(item.displaySum)}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleHistoryDelete(item.id)
                            }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-error/20 transition-all"
                            title="Удалить"
                          >
                            <svg className="w-3.5 h-3.5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Input Form & Result - stacked on mobile, side by side on xl */}
            <div className="flex flex-col xl:grid xl:grid-cols-2 gap-6 mb-6">
              {/* Input Section */}
              <div className="card flex flex-col min-h-[280px]">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-muted">Зашифрованная строка</label>
                  {input && (
                    <button
                      onClick={handleClear}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Стереть
                    </button>
                  )}
                </div>
                <textarea
                  className="input-area flex-1 min-h-[140px]"
                  placeholder="Вставьте зашифрованную строку QR-кода..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    className="btn-primary"
                    onClick={handleDecrypt}
                    disabled={!input.trim() || isDecrypting}
                  >
                    {isDecrypting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Расшифровка...
                      </span>
                    ) : (
                      'Расшифровать'
                    )}
                  </button>
                  <button className="btn-secondary" onClick={handleEncrypt} disabled={!input.trim() || isDecrypting}>
                    Зашифровать
                  </button>
                </div>
              </div>

              {/* Result/Empty State */}
              {result ? (
                <div className="card flex flex-col animate-fadeInUp">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-muted">Расшифрованная строка</label>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Скопировано
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Копировать
                        </>
                      )}
                    </button>
                  </div>
                  <code className="block text-sm break-all text-muted/80 bg-background/50 p-3 rounded-lg">
                    {result.raw}
                  </code>
                </div>
              ) : (
                <div className="card flex flex-col items-center justify-center text-center py-12">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-muted">Вставьте зашифрованную строку</p>
                  <p className="text-muted/60 text-sm mt-1">Результат появится здесь</p>
                </div>
              )}
            </div>

            {/* Fields Table - full width when result exists (not for encryption) */}
            {result && result.format !== 'Зашифровано' && (
              <div className="card animate-fadeInUp">
                <label className="block text-sm font-medium text-muted mb-3">Поля платежа</label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 pr-4 font-medium text-muted w-1/4">Поле</th>
                        <th className="text-left py-2 font-medium text-muted">Значение</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5">
                        <td className="py-2.5 pr-4 text-accent">Формат</td>
                        <td className="py-2.5">{result.format}</td>
                      </tr>
                      {result.fields.map((field, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="py-2.5 pr-4 text-accent">{field.name}</td>
                          <td className="py-2.5">{getDisplayValue(field.name, field.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
