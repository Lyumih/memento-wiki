import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Divider, Input, InputNumber, Slider, Space, Typography } from 'antd'
import { rollCardLevelUp } from '@/memento/rollCardLevelUp'
import { replacePercentTokensInText } from '@/memento/resolvePercentToken'
import { ModifierSlotsPanel, type ModifierSlotPreviewRow } from '@/widgets/ModifierSlotsPanel'

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
  const [slotPreview, setSlotPreview] = useState<ModifierSlotPreviewRow[]>([])

  const onSlotsPreviewChange = useCallback((rows: ModifierSlotPreviewRow[]) => {
    setSlotPreview(rows)
  }, [])

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
            {slotPreview.length > 0 ? (
              <>
                <Divider style={{ margin: '12px 0 8px' }} plain>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Модификаторы слотов (демо-числа)
                  </Typography.Text>
                </Divider>
                <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                  {slotPreview.map((row) => (
                    <Typography.Paragraph
                      key={`${row.slotIndex}-${row.id}`}
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        marginBottom: 0,
                      }}
                    >
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        Слот {row.slotIndex + 1} ·
                      </Typography.Text>{' '}
                      <strong>
                        {row.label}: {row.current}%
                      </strong>
                      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        {row.name} · база {row.base}% · Lm {row.lm} · при 100 → {row.at100}%
                      </Typography.Text>
                    </Typography.Paragraph>
                  ))}
                </Space>
              </>
            ) : null}
          </Space>
        </Card>

        <Card
          title="Уровень L и слоты модификаторов"
          size="small"
          style={{ flex: '1 1 0', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Typography.Text strong>Карта: уровень L</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Токены %% считаются от L. Слоты модов открываются по тем же порогам, что на странице «Моды на карте».
              Старт S — «Обновить уровень» сбрасывает L к S.
            </Typography.Text>
            <Typography.Text>
              Старт S (1–999): {startLevel}. Текущий L: <strong>{emulLevel}</strong>
            </Typography.Text>
            <Slider
              min={1}
              max={999}
              value={startLevel}
              onChange={setStartLevel}
              marks={{
                1: '1',
                75: '75',
                175: '175',
                275: '275',
                375: '375',
                999: '999',
              }}
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

            <ModifierSlotsPanel
              cardLevel={emulLevel}
              variant="compact"
              onSlotsPreviewChange={onSlotsPreviewChange}
            />
          </Space>
        </Card>
      </div>
    </Space>
  )
}
