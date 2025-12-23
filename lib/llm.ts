const OPENROUTER_API_KEY = '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'
const MODEL = 'mistralai/mistral-7b-instruct:free'

export async function fixRussianText(text: string): Promise<string> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cipher-qr.local',
        'X-Title': 'Cipher QR Decoder'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: `Исправь ошибки в русском тексте. Это платежные данные.

Примеры:
Сервей → Сергей
Евеенвевич → Евгеньевич
Центраненбй → Центральный
Мосэнерэосббт → Мосэнергосбыт
электроэнерэид → электроэнергию

Не меняй структуру (|, =, числа). Верни исправленный текст:

${text}`
        }],
        max_tokens: 1000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status)
      return text
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content?.trim()

    // Проверяем что результат валидный
    if (result && result.includes('|') && result.includes('=')) {
      return result
    }

    return text
  } catch (error) {
    console.error('LLM fix error:', error)
    return text
  }
}
