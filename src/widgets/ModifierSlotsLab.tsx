import { Card, Slider, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { isModifierSlotUnlocked, modifierSlotUnlockLevel, modifierUnlockedSlotCount } from '@/memento/modifierSlots'
import { GEN_MODIFIER_CATALOG, ModifierSlotsPanel } from '@/widgets/ModifierSlotsPanel'

const MIN_SLOT_ROWS = 3

export function ModifierSlotsLab() {
  const [cardLevel, setCardLevel] = useState(75)

  const unlocked = modifierUnlockedSlotCount(cardLevel)
  const displaySlotCount = Math.max(MIN_SLOT_ROWS, unlocked)

  const slotIndices = useMemo(
    () => Array.from({ length: displaySlotCount }, (_, k) => k),
    [displaySlotCount],
  )

  const slotThresholds = useMemo(
    () => slotIndices.map((k) => ({ k, need: modifierSlotUnlockLevel(k) })),
    [slotIndices],
  )

  const catalogPoolLabel = useMemo(
    () => GEN_MODIFIER_CATALOG.map((m) => m.name).join(' · '),
    [],
  )

  return (
    <Space
      orientation="vertical"
      size="large"
      style={{ width: '100%', marginTop: 16, display: 'flex', flexDirection: 'column' }}
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
          title="Уровень карты L и слоты"
          size="small"
          style={{ flex: '1 1 300px', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Typography.Text strong>L: {cardLevel}</Typography.Text>
            <Slider
              min={1}
              max={999}
              value={cardLevel}
              onChange={setCardLevel}
              marks={{
                1: '1',
                75: '75',
                175: '175',
                275: '275',
                375: '375',
                475: '475',
                575: '575',
                999: '999',
              }}
            />
            <Typography.Text>
              Открыто слотов: <strong>{unlocked}</strong>. Порог слота <strong>n</strong>:{' '}
              <Typography.Text code>L</Typography.Text> ≥ <Typography.Text code>75 + 100·(n − 1)</Typography.Text>{' '}
              (1-й при 75, 2-й при 175, 3-й при 275, 4-й при 375…). Ниже —{' '}
              <strong>{displaySlotCount}</strong> ряд(а/ов): не меньше трёх до порога 75, затем не меньше числа
              уже открытых слотов.
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Пороги:{' '}
              {slotThresholds
                .map(({ k, need }) => {
                  const n = k + 1
                  return `слот ${n} → L ≥ ${need}${isModifierSlotUnlocked(cardLevel, k) ? ' ✓' : ''}`
                })
                .join('; ')}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Пул оффера — <Typography.Text code>/db/mods</Typography.Text>,{' '}
              <Typography.Text code>game: gen</Typography.Text>: {catalogPoolLabel}
            </Typography.Text>
          </Space>
        </Card>

        <Card
          title="Слоты модификаторов: выбор и Lm"
          size="small"
          style={{ flex: '1 1 360px', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <ModifierSlotsPanel cardLevel={cardLevel} variant="full" />
        </Card>
      </div>
    </Space>
  )
}
