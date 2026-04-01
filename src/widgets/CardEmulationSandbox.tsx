import { useMemo, useState } from 'react'
import { Button, Card, Divider, Input, InputNumber, Select, Slider, Space, Typography } from 'antd'
import { modifierDemoValuesForId } from '@/memento/modifierDemoDisplay'
import rawDb from '@/generated/db.json'
import type { WikiDb } from '@/types/wikiDb'
import { rollCardLevelUp } from '@/memento/rollCardLevelUp'
import { rollModifierLevelUp } from '@/memento/rollModifierLevelUp'
import { replacePercentTokensInText } from '@/memento/resolvePercentToken'

const db = rawDb as WikiDb
const GEN_MODIFIERS = db.modifiers.filter((m) => m.game === 'gen' && m.type === 'modifier')

const INITIAL_DRAFT = `Огненный шар
Тактическое умение, урон по площади.

Снарядов за применение: 1%%f — на высоком уровне залп становится гуще.
Охват взрыва: 150%% площади поражения; сильнее карта — шире взрыв.`

export function CardEmulationSandbox() {
  const [startLevel, setStartLevel] = useState(1)
  const [emulLevel, setEmulLevel] = useState(1)
  const [lastR, setLastR] = useState<number | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [draft, setDraft] = useState(INITIAL_DRAFT)

  const [modId, setModId] = useState<string | null>(null)
  const [modLm, setModLm] = useState(1)
  const [lastModR, setLastModR] = useState<number | null>(null)
  const [lastModOk, setLastModOk] = useState<boolean | null>(null)

  const modDisplay = useMemo(
    () => (modId ? modifierDemoValuesForId(modId, modLm) : null),
    [modId, modLm],
  )

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

  const tryModLevelUp = () => {
    if (!modId) return
    const r = Math.floor(Math.random() * 100) + 1
    const ok = rollModifierLevelUp(modLm, r)
    setLastModR(r)
    setLastModOk(ok)
    if (ok) setModLm((x) => x + 1)
  }

  const onModChange = (value: string | null) => {
    setModId(value)
    setModLm(1)
    setLastModR(null)
    setLastModOk(null)
  }

  const preview = useMemo(
    () => replacePercentTokensInText(emulLevel, draft),
    [emulLevel, draft],
  )

  return (
    <Space
      orientation="vertical"
      size="large"
      style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column' }}
      styles={{ item: { width: '100%', maxWidth: '100%', minWidth: 0 } }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'stretch',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Card
          title="Создайте вашу карту или предмет"
          size="small"
          style={{ flex: '1 1 0', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
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
            {modDisplay ? (
              <>
                <Divider style={{ margin: '12px 0 8px' }} plain>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Модификатор слота (Lm = {modLm}, демо-числа)
                  </Typography.Text>
                </Divider>
                <Typography.Paragraph
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    marginBottom: 0,
                  }}
                >
                  <strong>
                    {modDisplay.label}: {modDisplay.current}%
                  </strong>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    база {modDisplay.base}% · при Lm = 100 → {modDisplay.at100}%
                  </Typography.Text>
                </Typography.Paragraph>
              </>
            ) : null}
          </Space>
        </Card>

        <Card
          title="Уровень L и модификатор Lm"
          size="small"
          style={{ flex: '1 1 0', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Typography.Text strong>Карта: уровень L</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Токены %% считаются от L. Старт S — «Обновить уровень» сбрасывает L к S.
            </Typography.Text>
            <Typography.Text>
              Старт S (1–999): {startLevel}. Текущий L: <strong>{emulLevel}</strong>
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
            <Space wrap>
              <Button type="primary" onClick={tryLevelUp}>
                Поднять L
              </Button>
              <Button onClick={resetLevel}>Обновить уровень</Button>
            </Space>
            {lastR !== null && lastOk !== null ? (
              <Typography.Text type={lastOk ? 'success' : 'secondary'}>
                Бросок L: r = {lastR}: {lastOk ? 'успех (+1)' : 'без улучшения'}
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary">Сделайте бросок L или обновите уровень.</Typography.Text>
            )}

            <Divider style={{ margin: '8px 0' }} />

            <Typography.Text strong>Модификатор: уровень Lm</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Тот же закон броска, что у L. Список — демо-каталог Gen; полный сценарий со слотами — на странице
              «Моды на карте».
            </Typography.Text>
            <Select
              allowClear
              placeholder="Без модификатора"
              style={{ width: '100%' }}
              value={modId}
              onChange={onModChange}
              options={GEN_MODIFIERS.map((m) => ({ value: m.id, label: m.name }))}
            />
            {modId ? (
              <Space orientation="vertical" style={{ width: '100%' }} size="small">
                <Space wrap align="center">
                  <Typography.Text>Lm: {modLm}</Typography.Text>
                  <InputNumber min={1} max={500} value={modLm} onChange={(v) => setModLm(v ?? 1)} />
                  <Button type="primary" onClick={tryModLevelUp}>
                    Бросок +1 к Lm
                  </Button>
                </Space>
                {lastModR !== null && lastModOk !== null ? (
                  <Typography.Text type={lastModOk ? 'success' : 'secondary'}>
                    Бросок Lm: r = {lastModR}: {lastModOk ? 'успех (+1)' : 'без улучшения'}
                  </Typography.Text>
                ) : (
                  <Typography.Text type="secondary">Прокачка Lm независима от L.</Typography.Text>
                )}
              </Space>
            ) : (
              <Typography.Text type="secondary">По желанию выберите тип — значение появится в превью слева.</Typography.Text>
            )}
          </Space>
        </Card>
      </div>
    </Space>
  )
}
