import { fixRussianText } from './llm'

// Таблица подстановки для дешифровки (латиница → кириллица)
const DECRYPT_MAP: Record<string, string> = {
  'a': 'к', 'b': 'л', 'c': 'м', 'd': 'н', 'e': 'о',
  'f': 'п', 'g': 'р', 'h': 'с', 'i': 'т', 'j': 'у',
  'k': 'ф', 'l': 'х', 'm': 'ц', 'n': 'ч', 'o': 'ш',
  'p': 'щ', 'q': 'а', 'r': 'б', 's': 'в', 't': 'э',
  'u': 'д', 'v': 'е', 'w': 'ж', 'x': 'з', 'y': 'и', 'z': 'й'
}

// Обратная таблица для шифрования (кириллица → латиница)
const ENCRYPT_MAP: Record<string, string> = {
  'к': 'a', 'л': 'b', 'м': 'c', 'н': 'd', 'о': 'e',
  'п': 'f', 'р': 'g', 'с': 'h', 'т': 'i', 'у': 'j',
  'ф': 'k', 'х': 'l', 'ц': 'm', 'ч': 'n', 'ш': 'o',
  'щ': 'p', 'а': 'q', 'б': 'r', 'в': 's', 'э': 't',
  'д': 'u', 'е': 'v', 'ж': 'w', 'з': 'x', 'и': 'y', 'й': 'z',
  // Альтернативные варианты (для шифрования используем основной)
  'ъ': 'q', 'ы': 'r', 'ь': 's', 'г': 't', 'ю': 'u', 'я': 'v'
}

// Типы
export interface QRField {
  name: string
  value: string
}

export interface DecryptResult {
  format: string
  fields: QRField[]
  raw: string
}

// Шифр Цезаря (дешифровка, сдвиг -3)
export function caesarDecrypt(text: string, shift: number = 3): string {
  return text.split('').map(char => {
    if (/[a-z]/i.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      return String.fromCharCode(((char.charCodeAt(0) - base - shift + 26) % 26) + base)
    }
    return char
  }).join('')
}

// Шифр Цезаря (шифрование, сдвиг +3)
export function caesarEncrypt(text: string, shift: number = 3): string {
  return text.split('').map(char => {
    if (/[a-z]/i.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base)
    }
    return char
  }).join('')
}

// Проверка URL
function isUrl(text: string): boolean {
  try {
    const url = new URL(text)
    return url.host !== null && url.host !== ''
  } catch {
    return false
  }
}

// Проверка: нужна ли подстановка для значения?
function needsSubstitution(value: string): boolean {
  // Если есть кириллица - НЕ нужна
  if (/[а-яёА-ЯЁ]/.test(value)) return false

  // Если нет латиницы - НЕ нужна
  if (!/[a-zA-Z]/.test(value)) return false

  // Если есть латиница с достаточным количеством букв - нужна
  const letters = (value.match(/[a-zA-Z]/g) || []).length
  const digits = (value.match(/\d/g) || []).length

  // Если букв >= 2 или букв больше чем цифр
  return letters >= 2 || letters > digits
}

// Простая подстановка (латиница → кириллица)
function simpleSubstitution(text: string): string {
  return text.split('').map(char => {
    const lower = char.toLowerCase()
    const mapped = DECRYPT_MAP[lower]
    if (mapped) {
      return char === char.toUpperCase() ? mapped.toUpperCase() : mapped
    }
    return char
  }).join('')
}

// Обратная подстановка (кириллица → латиница)
function reverseSubstitution(text: string): string {
  return text.split('').map(char => {
    const lower = char.toLowerCase()
    const mapped = ENCRYPT_MAP[lower]
    if (mapped) {
      return char === char.toUpperCase() ? mapped.toUpperCase() : mapped
    }
    return char
  }).join('')
}

// Основная функция дешифровки (async для LLM)
export async function decryptQRCode(encrypted: string): Promise<DecryptResult> {
  // URL не расшифровываем
  if (isUrl(encrypted)) {
    return { format: 'URL', fields: [], raw: encrypted }
  }

  const parts = encrypted.trim().split('|')

  // Формат: VW00012 → ST00012 (Caesar -3)
  const format = caesarDecrypt(parts[0], 3)

  const fields: QRField[] = []

  for (let i = 1; i < parts.length; i++) {
    const eqIndex = parts[i].indexOf('=')
    if (eqIndex === -1) continue

    // Ключ: Caesar -3
    const encKey = parts[i].substring(0, eqIndex)
    const name = caesarDecrypt(encKey, 3)

    // Значение: подстановка если есть латиница
    let value = parts[i].substring(eqIndex + 1)

    if (needsSubstitution(value)) {
      value = simpleSubstitution(value)
    }

    fields.push({ name, value })
  }

  // Собираем сырой результат
  let raw = format + '|' + fields.map(f => `${f.name}=${f.value}`).join('|')

  // LLM пост-обработка для исправления ошибок коллизий
  try {
    raw = await fixRussianText(raw)

    // Парсим исправленный результат обратно в fields
    const fixedParts = raw.split('|')
    const fixedFormat = fixedParts[0]
    const fixedFields: QRField[] = []

    for (let i = 1; i < fixedParts.length; i++) {
      const eqIndex = fixedParts[i].indexOf('=')
      if (eqIndex === -1) continue
      fixedFields.push({
        name: fixedParts[i].substring(0, eqIndex),
        value: fixedParts[i].substring(eqIndex + 1)
      })
    }

    return { format: fixedFormat, fields: fixedFields, raw }
  } catch (error) {
    console.error('LLM processing error:', error)
    return { format, fields, raw }
  }
}

// Синхронная версия без LLM (для шифрования и fallback)
export function decryptQRCodeSync(encrypted: string): DecryptResult {
  if (isUrl(encrypted)) {
    return { format: 'URL', fields: [], raw: encrypted }
  }

  const parts = encrypted.trim().split('|')
  const format = caesarDecrypt(parts[0], 3)
  const fields: QRField[] = []

  for (let i = 1; i < parts.length; i++) {
    const eqIndex = parts[i].indexOf('=')
    if (eqIndex === -1) continue

    const encKey = parts[i].substring(0, eqIndex)
    const name = caesarDecrypt(encKey, 3)

    let value = parts[i].substring(eqIndex + 1)
    if (needsSubstitution(value)) {
      value = simpleSubstitution(value)
    }

    fields.push({ name, value })
  }

  const raw = format + '|' + fields.map(f => `${f.name}=${f.value}`).join('|')
  return { format, fields, raw }
}

// Шифрование QR кода
export function encryptQRCode(decrypted: string): string {
  if (isUrl(decrypted)) return decrypted

  const parts = decrypted.trim().split('|')
  const encFormat = caesarEncrypt(parts[0], 3)
  const encParts: string[] = [encFormat]

  for (let i = 1; i < parts.length; i++) {
    const eqIndex = parts[i].indexOf('=')
    if (eqIndex === -1) {
      encParts.push(parts[i])
      continue
    }

    const name = parts[i].substring(0, eqIndex)
    let value = parts[i].substring(eqIndex + 1)

    // Ключ: Caesar +3
    const encKey = caesarEncrypt(name, 3)

    // Значение: если есть кириллица - подстановка
    if (/[а-яёА-ЯЁ]/.test(value)) {
      value = reverseSubstitution(value)
    }

    encParts.push(`${encKey}=${value}`)
  }

  return encParts.join('|')
}

// Форматирование суммы
export function formatSum(kopeks: string): string {
  const num = parseInt(kopeks, 10)
  if (isNaN(num)) return kopeks
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num / 100) + ' ₽'
}

// Форматирование периода
export function formatPeriod(period: string): string {
  const months = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const match = period.match(/^(\d{2})(\d{4})$/)
  if (!match) return period
  const month = parseInt(match[1], 10)
  return `${months[month] || match[1]} ${match[2]}`
}

// Отображаемое значение для поля
export function getDisplayValue(name: string, value: string): string {
  if (name === 'Sum') return formatSum(value)
  if (name === 'paymPeriod') return formatPeriod(value)
  return value
}
