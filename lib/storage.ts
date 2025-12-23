import type { DecryptResult } from './decrypt'

const STORAGE_KEY = 'cipherqr_history'

export interface HistoryItem {
  id: string
  timestamp: number
  encrypted: string
  result: DecryptResult
  displayName: string  // Name из результата
  displaySum: string   // Сумма
  actionType: 'decrypt' | 'encrypt'  // Тип действия
}

// Генерация уникального ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Форматирование даты: "вт. 24 дек 2024, 14:35"
export function formatHistoryDate(timestamp: number): string {
  const date = new Date(timestamp)
  const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн',
                  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

  const dayName = days[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${dayName}. ${day} ${month} ${year}, ${hours}:${minutes}`
}

// Получить историю
export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Сохранить в историю
export function saveToHistory(
  encrypted: string,
  result: DecryptResult,
  actionType: 'decrypt' | 'encrypt' = 'decrypt'
): HistoryItem {
  const history = getHistory()

  // Извлекаем Name и Sum для отображения
  const nameField = result.fields.find(f => f.name === 'Name')
  const sumField = result.fields.find(f => f.name === 'Sum')
  const purposeField = result.fields.find(f => f.name === 'Purpose')
  const bankField = result.fields.find(f => f.name === 'BankName')

  // Определяем что показывать как название
  let displayName = nameField?.value
  if (!displayName || displayName === 'Неизвестно') {
    // Пробуем другие поля
    displayName = purposeField?.value?.split('/')[0] || bankField?.value
  }
  if (!displayName) {
    // Показываем начало ввода
    displayName = encrypted.substring(0, 30) + (encrypted.length > 30 ? '...' : '')
  }

  const item: HistoryItem = {
    id: generateId(),
    timestamp: Date.now(),
    encrypted,
    result,
    displayName,
    displaySum: sumField?.value || '',
    actionType
  }

  // Добавляем в начало
  history.unshift(item)

  // Сохраняем
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))

  return item
}

// Удалить из истории
export function deleteFromHistory(id: string): void {
  const history = getHistory()
  const filtered = history.filter(item => item.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

// Очистить историю
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
