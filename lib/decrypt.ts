// Таблица дешифровки для текста в кавычках (кастомная подстановка)
const DECRYPT_MAP: Record<string, string> = {
  'a': 'к', 'b': 'л', 'c': 'м', 'd': 'н', 'e': 'о',
  'f': 'п', 'g': 'р', 'h': 'с', 'i': 'т', 'j': 'у',
  'k': 'ф', 'l': 'х', 'm': 'ц', 'n': 'ч', 'o': 'ш',
  'p': 'щ', 'q': 'а', 'r': 'б', 's': 'в', 't': 'э',
  'u': 'д', 'v': 'е', 'w': 'ж', 'x': 'з', 'y': 'и', 'z': 'й'
}

// Стандартная транслитерация Latin → Cyrillic (для префиксов после Caesar -3)
const TRANSLIT_MAP: Record<string, string> = {
  'a': 'а', 'b': 'б', 'c': 'ц', 'd': 'д', 'e': 'е',
  'f': 'ф', 'g': 'г', 'h': 'х', 'i': 'и', 'j': 'й',
  'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
  'p': 'п', 'q': 'к', 'r': 'р', 's': 'с', 't': 'т',
  'u': 'у', 'v': 'в', 'w': 'в', 'x': 'кс', 'y': 'ы', 'z': 'з'
}

// Альтернативные варианты для коллизий (используются при контекстном анализе)
const DECRYPT_ALT: Record<string, string> = {
  'q': 'ъ', 'r': 'ы', 's': 'ь', 't': 'г', 'u': 'ю', 'v': 'я'
}

// Поля с кириллицей
const CYRILLIC_FIELDS = ['Name', 'BankName', 'Purpose']

// ============================================
// Шифр Цезаря (дешифровка, сдвиг -3)
// ============================================
export function caesarDecrypt(text: string, shift: number = 3): string {
  return text.split('').map(char => {
    if (/[a-z]/i.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      return String.fromCharCode(((char.charCodeAt(0) - base - shift + 26) % 26) + base)
    }
    return char
  }).join('')
}

// ============================================
// Стандартная транслитерация (для префиксов)
// ============================================
function transliterate(text: string): string {
  return text.split('').map(char => {
    const lower = char.toLowerCase()
    const mapped = TRANSLIT_MAP[lower]
    if (mapped) {
      return char === char.toUpperCase() ? mapped.toUpperCase() : mapped
    }
    return char
  }).join('')
}

// ============================================
// Умная замена с выбором варианта
// ============================================
function smartSubstitution(text: string): string {
  const result: string[] = []
  const chars = text.split('')

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    const lower = char.toLowerCase()

    if (DECRYPT_MAP[lower]) {
      let replacement = DECRYPT_MAP[lower]

      // Для коллизий выбираем вариант на основе контекста
      if (DECRYPT_ALT[lower]) {
        const prev = result[result.length - 1] || ''
        const next = chars[i + 1] ? DECRYPT_MAP[chars[i + 1].toLowerCase()] || '' : ''

        // Эвристики для выбора варианта
        // 'r' после гласной скорее 'ы', иначе 'б'
        if (lower === 'r') {
          const vowels = 'аеёиоуыэюя'
          if (vowels.includes(prev.toLowerCase())) {
            replacement = 'ы'
          }
        }
        // 't' в начале слова или перед гласной скорее 'э'
        if (lower === 't') {
          const vowels = 'аеёиоуыэюя'
          if (vowels.includes(next.toLowerCase()) || prev === ' ' || prev === '') {
            replacement = 'э'
          } else {
            replacement = 'г'
          }
        }
      }

      result.push(char === char.toUpperCase() ? replacement.toUpperCase() : replacement)
    } else {
      result.push(char)
    }
  }

  return result.join('')
}

// ============================================
// Типы
// ============================================
export interface QRField {
  name: string
  value: string
}

export interface DecryptResult {
  format: string
  fields: QRField[]
  raw: string
}

// ============================================
// Основная функция дешифровки
// ============================================
export function decryptQRCode(encrypted: string): DecryptResult {
  const parts = encrypted.trim().split('|')

  // Формат: VW00012 → ST00012 (только Цезарь)
  const format = caesarDecrypt(parts[0], 3)

  const fields: QRField[] = []

  for (let i = 1; i < parts.length; i++) {
    const eqIndex = parts[i].indexOf('=')
    if (eqIndex === -1) continue

    // Ключ: применяем Цезарь
    const encKey = parts[i].substring(0, eqIndex)
    const name = caesarDecrypt(encKey, 3)

    // Значение
    let value = parts[i].substring(eqIndex + 1)

    // Для полей с кириллицей - применяем подстановку
    if (CYRILLIC_FIELDS.includes(name)) {
      // Обрабатываем текст в кавычках
      value = value.replace(/"([^"]+)"/g, (_, match) => {
        return '"' + smartSubstitution(match) + '"'
      })

      // Текст перед кавычками (НБ, ПАО и т.д.) - Caesar -3, потом транслитерация
      const quoteStart = value.indexOf('"')
      if (quoteStart > 0) {
        const prefix = value.substring(0, quoteStart).trim()
        const rest = value.substring(quoteStart)
        const decryptedPrefix = transliterate(caesarDecrypt(prefix, 3))
        value = decryptedPrefix + ' ' + rest
      }

      // Для Purpose: расшифровываем текст до первого /
      if (name === 'Purpose' && !value.includes('"')) {
        const slashIndex = value.indexOf('/')
        if (slashIndex !== -1) {
          // Caesar -3, потом транслитерация для текста Purpose
          value = transliterate(caesarDecrypt(value.substring(0, slashIndex), 3)) + value.substring(slashIndex)
        } else {
          value = transliterate(caesarDecrypt(value, 3))
        }
      }
    }

    fields.push({ name, value })
  }

  const raw = format + '|' + fields.map(f => `${f.name}=${f.value}`).join('|')

  return { format, fields, raw }
}

// ============================================
// Форматирование
// ============================================
export function formatSum(kopeks: string): string {
  const num = parseInt(kopeks, 10)
  if (isNaN(num)) return kopeks
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num / 100) + ' ₽'
}

export function formatPeriod(period: string): string {
  const months = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const match = period.match(/^(\d{2})(\d{4})$/)
  if (!match) return period
  const month = parseInt(match[1], 10)
  return `${months[month] || match[1]} ${match[2]}`
}

export function getDisplayValue(name: string, value: string): string {
  if (name === 'Sum') return formatSum(value)
  if (name === 'paymPeriod') return formatPeriod(value)
  return value
}
