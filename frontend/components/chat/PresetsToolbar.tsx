"use client"

// Preset buttons — prompts are placeholders, refined in prompt engineering phase
const PRESETS = [
  { icon: "✦", label: "Объяснить", prompt: "Объясни мне эту лекцию с нуля, простым языком. Используй аналогии." },
  { icon: "⚡", label: "Задачи", prompt: "Создай 5 практических задач по этой лекции, от простого к сложному." },
  { icon: "🔍", label: "Концепция", prompt: null, requiresSelection: true },
  { icon: "💡", label: "Подсказка", prompt: "Дай подсказку к задаче, не раскрывая полного решения." },
  { icon: "🔎", label: "Проверить", prompt: null, requiresEditorContent: true },
  { icon: "📋", label: "Резюме", prompt: "Сделай краткое резюме этой лекции в виде буллетов." },
]

interface PresetsToolbarProps {
  lectureId: string
  getSelectedText: () => string
  getEditorContent: () => string   // returns current practice tab content
  onSendMessage?: (message: string) => void
}

export function PresetsToolbar({ lectureId: _lectureId, getSelectedText, getEditorContent, onSendMessage }: PresetsToolbarProps) {
  const handlePreset = (preset: typeof PRESETS[0]) => {
    if (preset.requiresSelection) {
      const selected = getSelectedText()
      if (!selected.trim()) {
        alert("Выделите текст в редакторе")
        return
      }
      onSendMessage?.(`Объясни подробно следующую концепцию: ${selected}`)
      return
    }
    if (preset.requiresEditorContent) {
      const code = getEditorContent()
      onSendMessage?.(`Проверь этот код и дай обратную связь:\n\n${code}`)
      return
    }
    if (preset.prompt) {
      onSendMessage?.(preset.prompt)
    }
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[#181825] border-b border-[#313244] flex-wrap">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => handlePreset(preset)}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] transition-colors"
        >
          <span>{preset.icon}</span>
          <span>{preset.label}</span>
        </button>
      ))}
    </div>
  )
}
