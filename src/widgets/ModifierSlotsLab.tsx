import { Button, Card, InputNumber, Slider, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import {
  filterModifierPoolByTags,
  type ModifierDefLike,
  pickModifierOffer,
} from '@/memento/modifierOffer'
import { modifierScaledPercent } from '@/memento/modifierPotency'
import { rollModifierLevelUp } from '@/memento/rollModifierLevelUp'
import {
  isModifierSlotUnlocked,
  modifierSlotUnlockLevel,
  modifierUnlockedSlotCount,
} from '@/memento/modifierSlots'

const DEMO_POOL: ModifierDefLike[] = [
  { id: 'crit', tags: ['melee', 'attack'] },
  { id: 'vamp', tags: ['melee', 'attack'] },
  { id: 'double', tags: ['melee', 'attack'] },
  { id: 'cdr', tags: ['melee'] },
  { id: 'mana', tags: ['spell'] },
]

export function ModifierSlotsLab() {
  const [cardLevel, setCardLevel] = useState(75)
  const [lm, setLm] = useState(1)
  const [lastR, setLastR] = useState<number | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [offerIds, setOfferIds] = useState<string[] | null>(null)

  const unlocked = modifierUnlockedSlotCount(cardLevel)
  const slotThresholds = useMemo(
    () => [0, 1, 2].map((k) => ({ k, need: modifierSlotUnlockLevel(k) })),
    [],
  )

  const meleePool = useMemo(() => filterModifierPoolByTags(DEMO_POOL, ['melee']), [])

  const rollLm = () => {
    const r = Math.floor(Math.random() * 100) + 1
    const ok = rollModifierLevelUp(lm, r)
    setLastR(r)
    setLastOk(ok)
    if (ok) setLm((x) => x + 1)
  }

  const resetLm = () => {
    setLm(1)
    setLastR(null)
    setLastOk(null)
  }

  const genOffer = () => {
    const picks = pickModifierOffer(meleePool, 3, (n) => Math.floor(Math.random() * n))
    setOfferIds(picks.map((p) => p.id))
  }

  const doubleStrikeDemo = modifierScaledPercent(40, lm)

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
          style={{ flex: '1 1 280px', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Typography.Text strong>L: {cardLevel}</Typography.Text>
            <Slider
              min={1}
              max={300}
              value={cardLevel}
              onChange={setCardLevel}
              marks={{ 1: '1', 75: '75', 175: '175', 275: '275', 300: '300' }}
            />
            <Typography.Text>
              Открыто слотов модификаторов: <strong>{unlocked}</strong>
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Пороги:{' '}
              {slotThresholds
                .map(({ k, need }) => `слот ${k + 1} → L ≥ ${need}${isModifierSlotUnlocked(cardLevel, k) ? ' ✓' : ''}`)
                .join('; ')}
            </Typography.Text>
          </Space>
        </Card>

        <Card
          title="Слот 0: уровень модификатора Lm"
          size="small"
          style={{ flex: '1 1 280px', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            {!isModifierSlotUnlocked(cardLevel, 0) ? (
              <Typography.Text type="warning">
                Слот 0 закрыт: поднимите L до {modifierSlotUnlockLevel(0)}.
              </Typography.Text>
            ) : (
              <>
                <Typography.Text strong>Lm: {lm}</Typography.Text>
                <Slider min={1} max={200} value={lm} onChange={setLm} marks={{ 1: '1', 100: '100', 200: '200' }} />
                <Space wrap>
                  <Typography.Text>Lm:</Typography.Text>
                  <InputNumber min={1} max={500} value={lm} onChange={(v) => setLm(v ?? 1)} />
                </Space>
                <Space wrap>
                  <Button type="primary" onClick={rollLm} disabled={!isModifierSlotUnlocked(cardLevel, 0)}>
                    Бросок +1 к Lm
                  </Button>
                  <Button onClick={resetLm}>Сбросить Lm → 1</Button>
                </Space>
                {lastR !== null && lastOk !== null ? (
                  <Typography.Text type={lastOk ? 'success' : 'secondary'}>
                    r = {lastR}: {lastOk ? 'успех (+1 к Lm)' : 'без улучшения'}
                  </Typography.Text>
                ) : (
                  <Typography.Text type="secondary">Тот же закон, что rollCardLevelUp для уровня карты.</Typography.Text>
                )}
                <Typography.Text>
                  Пример «двойной удар» база 40% → при текущем Lm:{' '}
                  <strong>{doubleStrikeDemo}%</strong> (демо-формула v1)
                </Typography.Text>
              </>
            )}
          </Space>
        </Card>

        <Card
          title="Оффер из пула (тег melee)"
          size="small"
          style={{ flex: '1 1 280px', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Пул: {meleePool.map((p) => p.id).join(', ')}
            </Typography.Text>
            <Button onClick={genOffer}>Сгенерировать 3 варианта</Button>
            {offerIds ? (
              <Typography.Text>
                Варианты: <strong>{offerIds.join(', ')}</strong>
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary">Нажмите кнопку — выбор с возвращением, дубликаты возможны.</Typography.Text>
            )}
          </Space>
        </Card>
      </div>
    </Space>
  )
}
