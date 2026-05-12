import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi, authApi, telegramApi, exportApi } from '../api/endpoints'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useThemeStore } from '../store/themeStore'
import toast from 'react-hot-toast'

export default function Impostazioni() {
  const qc = useQueryClient()
  const { theme, setTheme } = useThemeStore()

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data),
  })

  const [form, setForm] = useState({
    calorie_goal: 1700, protein_goal: 100, height_cm: '',
    telegram_chat_id: '', telegram_bot_token: '', claude_api_key: '',
    telegram_reminders_enabled: false,
  })

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })

  useEffect(() => {
    if (settings) {
      setForm({
        calorie_goal: settings.calorie_goal,
        protein_goal: settings.protein_goal,
        height_cm: settings.height_cm ? String(settings.height_cm) : '',
        telegram_chat_id: settings.telegram_chat_id || '',
        telegram_bot_token: settings.telegram_bot_token || '',
        claude_api_key: '',
        telegram_reminders_enabled: settings.telegram_reminders_enabled,
      })
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => settingsApi.update(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Impostazioni salvate!') },
    onError: () => toast.error('Errore nel salvataggio'),
  })

  const pwMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => authApi.changePassword(data.current_password, data.new_password),
    onSuccess: () => { setPwForm({ current_password: '', new_password: '', confirm_password: '' }); toast.success('Password cambiata!') },
    onError: () => toast.error('Password attuale errata'),
  })

  const handleSaveSettings = () => {
    const data: Record<string, unknown> = {
      calorie_goal: form.calorie_goal,
      protein_goal: form.protein_goal,
      telegram_reminders_enabled: form.telegram_reminders_enabled,
    }
    if (form.height_cm) data.height_cm = parseFloat(form.height_cm)
    if (form.telegram_chat_id) data.telegram_chat_id = form.telegram_chat_id
    if (form.telegram_bot_token) data.telegram_bot_token = form.telegram_bot_token
    if (form.claude_api_key) data.claude_api_key = form.claude_api_key
    updateMutation.mutate(data)
  }

  const handleChangePassword = () => {
    if (pwForm.new_password !== pwForm.confirm_password) return toast.error('Le password non coincidono')
    if (pwForm.new_password.length < 6) return toast.error('Password troppo corta')
    pwMutation.mutate({ current_password: pwForm.current_password, new_password: pwForm.new_password })
  }

  const handleExportCSV = async () => {
    try {
      const resp = await exportApi.csv()
      const url = URL.createObjectURL(new Blob([resp.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'andrea_health.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Errore export') }
  }

  const handleExportPDF = async () => {
    try {
      const resp = await exportApi.pdf()
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = 'andrea_health.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Errore export') }
  }

  const handleTestTelegram = async () => {
    try {
      await telegramApi.test()
      toast.success('Messaggio inviato!')
    } catch { toast.error('Errore: controlla token e chat_id') }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">⚙️ Impostazioni</h1>
        <p className="text-gray-400 text-sm">Personalizza l'app</p>
      </div>

      {/* Objectives */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">🎯 Obiettivi</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Obiettivo calorico (kcal)</label>
            <input
              type="number"
              value={form.calorie_goal}
              onChange={(e) => setForm((p) => ({ ...p, calorie_goal: parseInt(e.target.value) || 1700 }))}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00e5a0]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Obiettivo proteico (g)</label>
            <input
              type="number"
              value={form.protein_goal}
              onChange={(e) => setForm((p) => ({ ...p, protein_goal: parseInt(e.target.value) || 100 }))}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00e5a0]"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Altezza (cm) — per calcolo BMI</label>
            <input
              type="number"
              step="0.5"
              value={form.height_cm}
              onChange={(e) => setForm((p) => ({ ...p, height_cm: e.target.value }))}
              placeholder="175"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00e5a0]"
            />
          </div>
        </div>
      </Card>

      {/* Tema */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">🎨 Tema</h3>
        <div className="flex gap-3">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTheme(t); updateMutation.mutate({ theme: t }) }}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors
                ${theme === t ? 'bg-[#00e5a0] text-black font-semibold' : 'bg-[#2a2d3a] text-gray-400 hover:text-white'}`}
            >
              {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          ))}
        </div>
      </Card>

      {/* Claude API */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">🤖 Claude AI</h3>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            API Key {settings?.has_claude_api_key && <span className="text-[#00e5a0]">✓ Configurata</span>}
          </label>
          <input
            type="password"
            value={form.claude_api_key}
            onChange={(e) => setForm((p) => ({ ...p, claude_api_key: e.target.value }))}
            placeholder={settings?.has_claude_api_key ? '••••••••••••• (lascia vuoto per mantenere)' : 'sk-ant-...'}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00e5a0] font-mono"
          />
        </div>
      </Card>

      {/* Telegram */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">📱 Telegram Bot</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Bot Token</label>
            <input
              type="password"
              value={form.telegram_bot_token}
              onChange={(e) => setForm((p) => ({ ...p, telegram_bot_token: e.target.value }))}
              placeholder="1234567890:ABCdef..."
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00e5a0] font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Chat ID</label>
            <input
              type="text"
              value={form.telegram_chat_id}
              onChange={(e) => setForm((p) => ({ ...p, telegram_chat_id: e.target.value }))}
              placeholder="123456789"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00e5a0] font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tg-reminders"
              checked={form.telegram_reminders_enabled}
              onChange={(e) => setForm((p) => ({ ...p, telegram_reminders_enabled: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="tg-reminders" className="text-sm text-gray-300">Abilita reminder Telegram</label>
          </div>
          <Button variant="secondary" size="sm" onClick={handleTestTelegram}>📤 Invia messaggio test</Button>
        </div>
      </Card>

      {/* Save button */}
      <Button onClick={handleSaveSettings} loading={updateMutation.isPending}>
        💾 Salva impostazioni
      </Button>

      {/* Password change */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">🔐 Cambia password</h3>
        <div className="space-y-3">
          {[
            { key: 'current_password', label: 'Password attuale' },
            { key: 'new_password', label: 'Nuova password' },
            { key: 'confirm_password', label: 'Conferma nuova password' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
              <input
                type="password"
                value={pwForm[f.key as keyof typeof pwForm]}
                onChange={(e) => setPwForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00e5a0]"
              />
            </div>
          ))}
          <Button variant="secondary" onClick={handleChangePassword} loading={pwMutation.isPending} size="sm">
            Cambia password
          </Button>
        </div>
      </Card>

      {/* Export */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">📥 Export dati</h3>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExportCSV}>📊 Export CSV</Button>
          <Button variant="secondary" onClick={handleExportPDF}>📄 Export PDF</Button>
        </div>
      </Card>
    </div>
  )
}
