import { Button, Card, Divider, InputNumber, Slider, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { pickModifierOffer } from '@/memento/modifierOffer'
import { modifierScaledPercent } from '@/memento/modifierPotency'
import { rollModifierLevelUp } from '@/memento/rollModifierLevelUp'
import {
  isModifierSlotUnlocked,
  modifierSlotUnlockLevel,
  modifierUnlockedSlotCount,
} from '@/memento/modifierSlots'
import rawDb from '@/generated/db.json'
import type { DbEntity, WikiDb } from '@/types/wikiDb'

const db = rawDb as WikiDb

/** Подборка из демо-каталога `/db/mods` (записи с game: gen). */
const GEN_MODIFIER_CATALOG = db.modifiers.filter((m) => m.game === 'gen' && m.type === 'modifier')

const SLOT_INDICES = [0, 1, 2] as const

const emptyChosen: (DbEntity | null)[] = [null, null, null]
const emptyOffers: (DbEntity[] | null)[] = [null, null, null]

export function ModifierSlotsLab() {
  const [cardLevel, setCardLevel] = useState(75)
  const [slotChosen, setSlotChosen] = useState<(DbEntity | null)[]>(() => [...emptyChosen])
  const [slotOffer, setSlotOffer] = useState<(DbEntity[] | null)[]>(() => [...emptyOffers])
  const [lmBySlot, setLmBySlot] = useState<number[]>(() => [1, 1, 1])
  const [lastLmRoll, setLastLmRoll] = useState<{ slotIndex: number; r: number; ok: boolean } | null>(
    null,
  )

  const unlocked = modifierUnlockedSlotCount(cardLevel)
  const slotThresholds = useMemo(
    () => SLOT_INDICES.map((k) => ({ k, need: modifierSlotUnlockLevel(k) })),
    [],
  )

  const catalogPoolLabel = useMemo(
    () => GEN_MODIFIER_CATALOG.map((m) => m.name).join(' · '),
    [],
  )

  useEffect(() => {
    setSlotChosen((prev) =>
      SLOT_INDICES.map((k) => (isModifierSlotUnlocked(cardLevel, k) ? prev[k] : null)),
    )
    setSlotOffer((prev) =>
      SLOT_INDICES.map((k) => (isModifierSlotUnlocked(cardLevel, k) ? prev[k] : null)),
    )
    setLmBySlot((prev) =>
      SLOT_INDICES.map((k) => (isModifierSlotUnlocked(cardLevel, k) ? prev[k] : 1)),
    )
  }, [cardLevel])

  const genOffer = (slotIndex: number) => {
    if (!isModifierSlotUnlocked(cardLevel, slotIndex) || GEN_MODIFIER_CATALOG.length === 0) return
    const picks = pickModifierOffer(GEN_MODIFIER_CATALOG, 3, (n) => Math.floor(Math.random() * n))
    setSlotOffer((prev) => {
      const next = [...prev]
      next[slotIndex] = picks
      return next
    })
  }

  const pickFromOffer = (slotIndex: number, entity: DbEntity) => {
    setSlotChosen((prev) => {
      const next = [...prev]
      next[slotIndex] = entity
      return next
    })
    setSlotOffer((prev) => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }

  const clearSlot = (slotIndex: number) => {
    setSlotChosen((prev) => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
    setSlotOffer((prev) => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
    setLmBySlot((prev) => {
      const next = [...prev]
      next[slotIndex] = 1
      return next
    })
    setLastLmRoll(null)
  }

  const setLm = (slotIndex: number, value: number) => {
    setLmBySlot((prev) => {
      const next = [...prev]
      next[slotIndex] = value
      return next
    })
  }

  const rollLm = (slotIndex: number) => {
    const lm = lmBySlot[slotIndex] ?? 1
    const r = Math.floor(Math.random() * 100) + 1
    const ok = rollModifierLevelUp(lm, r)
    setLastLmRoll({ slotIndex, r, ok })
    if (ok) {
      setLmBySlot((prev) => {
        const next = [...prev]
        next[slotIndex] = (next[slotIndex] ?? 1) + 1
        return next
      })
    }
  }

  const doubleStrikeLm = useMemo(() => {
    const idx = slotChosen.findIndex((c) => c?.id === 'slot-double-strike')
    if (idx >= 0) return lmBySlot[idx] ?? 1
    const first = slotChosen.findIndex((c) => c !== null)
    if (first >= 0) return lmBySlot[first] ?? 1
    return lmBySlot[0] ?? 1
  }, [slotChosen, lmBySlot])

  const doubleStrikeDemo = modifierScaledPercent(40, doubleStrikeLm)

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
              max={300}
              value={cardLevel}
              onChange={setCardLevel}
              marks={{ 1: '1', 75: '75', 175: '175', 275: '275', 300: '300' }}
            />
            <Typography.Text>
              Открыто слотов: <strong>{unlocked}</strong> из 3. Следующий слот открывается при{' '}
              <Typography.Text code>L</Typography.Text> ≥ 175, затем ≥ 275 (первый — при ≥ 75).
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
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {SLOT_INDICES.map((k) => {
              const need = modifierSlotUnlockLevel(k)
              const open = isModifierSlotUnlocked(cardLevel, k)
              const chosen = slotChosen[k]
              const offer = slotOffer[k]
              const lm = lmBySlot[k] ?? 1

              return (
                <div key={k}>
                  {k > 0 ? <Divider style={{ margin: '8px 0' }} /> : null}
                  <Typography.Text strong>
                    Слот {k + 1}{' '}
                    <Typography.Text type="secondary">(нужен L ≥ {need})</Typography.Text>
                  </Typography.Text>

                  {!open ? (
                    <Typography.Text type="warning" style={{ display: 'block', marginTop: 8 }}>
                      Закрыт. Поднимите L до {need}, чтобы получить оффер из трёх модификаторов.
                    </Typography.Text>
                  ) : chosen ? (
                    <Space orientation="vertical" style={{ width: '100%', marginTop: 8 }}>
                      <Typography.Text>
                        Выбрано: <strong>{chosen.name}</strong>
                      </Typography.Text>
                      <Space wrap align="center">
                        <Typography.Text>Lm: {lm}</Typography.Text>
                        <Slider
                          min={1}
                          max={200}
                          style={{ minWidth: 120, flex: '1 1 140px' }}
                          value={lm}
                          onChange={(v) => setLm(k, v)}
                        />
                        <InputNumber min={1} max={500} value={lm} onChange={(v) => setLm(k, v ?? 1)} />
                        <Button type="primary" onClick={() => rollLm(k)}>
                          Бросок +1 к Lm
                        </Button>
                        <Button onClick={() => clearSlot(k)}>Снять модификатор</Button>
                      </Space>
                      {lastLmRoll && lastLmRoll.slotIndex === k ? (
                        <Typography.Text type={lastLmRoll.ok ? 'success' : 'secondary'}>
                          r = {lastLmRoll.r}: {lastLmRoll.ok ? 'успех (+1 к Lm)' : 'без улучшения'}
                        </Typography.Text>
                      ) : null}
                    </Space>
                  ) : offer ? (
                    <Space orientation="vertical" style={{ width: '100%', marginTop: 8 }}>
                      <Typography.Text type="secondary">Выберите один из трёх:</Typography.Text>
                      <Space wrap>
                        {offer.map((entity, i) => (
                          <Button
                            key={`${k}-${i}-${entity.id}`}
                            type="default"
                            onClick={() => pickFromOffer(k, entity)}
                          >
                            {entity.name}
                          </Button>
                        ))}
                      </Space>
                    </Space>
                  ) : (
                    <Space style={{ marginTop: 8 }}>
                      <Button
                        onClick={() => genOffer(k)}
                        disabled={GEN_MODIFIER_CATALOG.length === 0}
                      >
                        Показать 3 варианта
                      </Button>
                    </Space>
                  )}
                </div>
              )
            })}

            <Divider style={{ margin: '12px 0 8px' }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Пример масштаба для «двойного удара» (база 40%):{' '}
              <strong>{doubleStrikeDemo}%</strong> при выбранном Lm (если в слоте — запись «Шанс двойного
              удара», берётся её Lm; иначе первый заполненный слот).
            </Typography.Text>
          </Space>
        </Card>
      </div>
    </Space>
  )
}
