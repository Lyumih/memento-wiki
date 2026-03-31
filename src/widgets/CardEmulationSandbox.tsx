import { useState, useMemo } from 'react'
import { Button, Card, Input, InputNumber, Slider, Space, Typography } from 'antd'
import { rollCardLevelUp } from '@/memento/rollCardLevelUp'
import { replacePercentTokensInText } from '@/memento/resolvePercentToken'

const INITIAL_DRAFT = 'Урон 40%%50, база 10%%'

export function CardEmulationSandbox() {
  const [startLevel, setStartLevel] = useState(1)
  const [emulLevel, setEmulLevel] = useState(1)
  const [lastR, setLastR] = useState<number | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [draft, setDraft] = useState(INITIAL_DRAFT)

  const tryLevelUp = () => {
    const r = Math.floor(Math.random() * 100) + 1
    const ok = rollCardLevelUp(emulLevel, r)
    setLastR(r)
    setLastOk(ok)
    if (ok) setEmulLevel((x) => x + 1)
  }

  const resetLevel = () => {
    setEmulLevel(startLevel)
    setLastR(null)
    setLastOk(null)
  }

  const preview = useMemo(
    () => replacePercentTokensInText(emulLevel, draft),
    [emulLevel, draft],
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
      <Card title="Создайте вашу карту или предмет" size="small">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input.TextArea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <Typography.Text type="secondary">Превью (L = {emulLevel}):</Typography.Text>
          <Typography.Paragraph
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              marginBottom: 0,
            }}
          >
            {preview}
          </Typography.Paragraph>
        </Space>
      </Card>

      <Card title="Эмуляция уровня карты" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>
            Старт S (1–999): {startLevel}. Кнопка «Обновить уровень» выставляет L = S.
          </Typography.Text>
          <Slider
            min={1}
            max={999}
            value={startLevel}
            onChange={setStartLevel}
            marks={{ 1: '1', 250: '250', 500: '500', 750: '750', 999: '999' }}
          />
          <Space wrap>
            <Typography.Text>S:</Typography.Text>
            <InputNumber min={1} max={999} value={startLevel} onChange={(v) => setStartLevel(v ?? 1)} />
          </Space>
          <Typography.Text strong>Текущий уровень эмуляции L: {emulLevel}</Typography.Text>
          <Space wrap>
            <Button type="primary" onClick={tryLevelUp}>
              Поднять уровень
            </Button>
            <Button onClick={resetLevel}>Обновить уровень</Button>
          </Space>
          {lastR !== null && lastOk !== null ? (
            <Typography.Text type={lastOk ? 'success' : 'secondary'}>
              Бросок r = {lastR}: {lastOk ? 'успех (+1 уровень)' : 'без улучшения'}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">Сделайте бросок или сброс.</Typography.Text>
          )}
        </Space>
      </Card>
    </Space>
  )
}
