import { Button, Divider, InputNumber, Slider, Space, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { pickModifierOffer } from '@/memento/modifierOffer'
import { modifierScaledPercent } from '@/memento/modifierPotency'
import { rollModifierLevelUp } from '@/memento/rollModifierLevelUp'
import {
  isModifierSlotUnlocked,
  modifierSlotUnlockLevel,
  modifierUnlockedSlotCount,
} from '@/memento/modifierSlots'
import { modifierDemoValuesForId } from '@/memento/modifierDemoDisplay'
import rawDb from '@/generated/db.json'
import type { DbEntity, WikiDb } from '@/types/wikiDb'

const db = rawDb as WikiDb

export const GEN_MODIFIER_CATALOG = db.modifiers.filter((m) => m.game === 'gen' && m.type === 'modifier')

const MIN_SLOT_ROWS = 3

export type ModifierSlotPreviewRow = {
  slotIndex: number
  name: string
  id: string
  lm: number
  label: string
  current: number
  base: number
  at100: number
}

type Props = {
  /** Уровень карты L — пороги слотов 75, 175, 275, 375… */
  cardLevel: number
  variant?: 'full' | 'compact'
  /** Для превью карты: обновляется при смене выбора или Lm */
  onSlotsPreviewChange?: (rows: ModifierSlotPreviewRow[]) => void
}

export function ModifierSlotsPanel({ cardLevel, variant = 'full', onSlotsPreviewChange }: Props) {
  const [slotChosen, setSlotChosen] = useState<(DbEntity | null)[]>(() =>
    Array.from({ length: MIN_SLOT_ROWS }, () => null),
  )
  const [slotOffer, setSlotOffer] = useState<(DbEntity[] | null)[]>(() =>
    Array.from({ length: MIN_SLOT_ROWS }, () => null),
  )
  const [lmBySlot, setLmBySlot] = useState<number[]>(() => Array.from({ length: MIN_SLOT_ROWS }, () => 1))
  const [lastLmRoll, setLastLmRoll] = useState<{ slotIndex: number; r: number; ok: boolean } | null>(
    null,
  )

  const unlocked = modifierUnlockedSlotCount(cardLevel)
  const displaySlotCount = Math.max(MIN_SLOT_ROWS, unlocked)

  const slotIndices = useMemo(
    () => Array.from({ length: displaySlotCount }, (_, k) => k),
    [displaySlotCount],
  )

  useEffect(() => {
    const need = Math.max(MIN_SLOT_ROWS, modifierUnlockedSlotCount(cardLevel))
    setSlotChosen((prev) =>
      Array.from({ length: need }, (_, k) =>
        isModifierSlotUnlocked(cardLevel, k) ? (prev[k] ?? null) : null,
      ),
    )
    setSlotOffer((prev) =>
      Array.from({ length: need }, (_, k) =>
        isModifierSlotUnlocked(cardLevel, k) ? (prev[k] ?? null) : null,
      ),
    )
    setLmBySlot((prev) =>
      Array.from({ length: need }, (_, k) =>
        isModifierSlotUnlocked(cardLevel, k) ? (prev[k] ?? 1) : 1,
      ),
    )
  }, [cardLevel])

  useEffect(() => {
    if (!onSlotsPreviewChange) return
    const rows: ModifierSlotPreviewRow[] = []
    slotChosen.forEach((c, k) => {
      if (!c) return
      const lm = lmBySlot[k] ?? 1
      const v = modifierDemoValuesForId(c.id, lm)
      rows.push({
        slotIndex: k,
        name: c.name,
        id: c.id,
        lm,
        label: v.label,
        current: v.current,
        base: v.base,
        at100: v.at100,
      })
    })
    onSlotsPreviewChange(rows)
  }, [slotChosen, lmBySlot, onSlotsPreviewChange])

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

  const compact = variant === 'compact'

  return (
    <Space orientation="vertical" size={compact ? 'small' : 'middle'} style={{ width: '100%' }}>
      {compact ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Слоты открываются при том же <Typography.Text code>L</Typography.Text>, что и превью: порог{' '}
          <Typography.Text code>75 + 100·(n−1)</Typography.Text>. Открыто сейчас:{' '}
          <strong>{unlocked}</strong>.
        </Typography.Text>
      ) : null}

      {slotIndices.map((k) => {
        const need = modifierSlotUnlockLevel(k)
        const open = isModifierSlotUnlocked(cardLevel, k)
        const chosen = slotChosen[k]
        const offer = slotOffer[k]
        const lm = lmBySlot[k] ?? 1

        return (
          <div key={k}>
            {k > 0 ? <Divider style={{ margin: compact ? '6px 0' : '8px 0' }} /> : null}
            <Typography.Text strong style={{ fontSize: compact ? 13 : undefined }}>
              Слот {k + 1}{' '}
              <Typography.Text type="secondary">(L ≥ {need})</Typography.Text>
            </Typography.Text>

            {!open ? (
              <Typography.Text type="warning" style={{ display: 'block', marginTop: 8, fontSize: compact ? 12 : undefined }}>
                Закрыт до L ≥ {need}.
              </Typography.Text>
            ) : chosen ? (
              <Space orientation="vertical" style={{ width: '100%', marginTop: 8 }} size="small">
                <Typography.Text style={{ fontSize: compact ? 13 : undefined }}>
                  <strong>{chosen.name}</strong>
                </Typography.Text>
                {(() => {
                  const v = modifierDemoValuesForId(chosen.id, lm)
                  return (
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      <Typography.Text strong style={{ fontSize: compact ? 14 : 15 }}>
                        {v.label}: {v.current}%
                      </Typography.Text>
                      {!compact ? (
                        <>
                          <br />
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Демо-база {v.base}% · Lm = {lm} · при Lm = 100 → {v.at100}%
                          </Typography.Text>
                        </>
                      ) : (
                        <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                          база {v.base}% · Lm {lm}
                        </Typography.Text>
                      )}
                    </Typography.Paragraph>
                  )
                })()}
                <Space wrap align="center" size="small">
                  <Typography.Text style={{ fontSize: compact ? 12 : undefined }}>Lm {lm}</Typography.Text>
                  {!compact ? (
                    <Slider
                      min={1}
                      max={200}
                      style={{ minWidth: 100, flex: '1 1 120px' }}
                      value={lm}
                      onChange={(v) => setLm(k, v)}
                    />
                  ) : null}
                  <InputNumber min={1} max={500} size="small" value={lm} onChange={(v) => setLm(k, v ?? 1)} />
                  <Button type="primary" size={compact ? 'small' : 'middle'} onClick={() => rollLm(k)}>
                    +1 Lm
                  </Button>
                  <Button size={compact ? 'small' : 'middle'} onClick={() => clearSlot(k)}>
                    Снять
                  </Button>
                </Space>
                {lastLmRoll && lastLmRoll.slotIndex === k ? (
                  <Typography.Text type={lastLmRoll.ok ? 'success' : 'secondary'} style={{ fontSize: 12 }}>
                    r={lastLmRoll.r}: {lastLmRoll.ok ? '+1' : 'нет'}
                  </Typography.Text>
                ) : null}
              </Space>
            ) : offer ? (
              <Space orientation="vertical" style={{ width: '100%', marginTop: 8 }} size="small">
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Выберите:
                </Typography.Text>
                <Space wrap size="small">
                  {offer.map((entity, i) => {
                    const v = modifierDemoValuesForId(entity.id, 1)
                    return (
                      <Tooltip
                        key={`${k}-${i}-${entity.id}`}
                        title={`База ${v.base}% (демо)`}
                      >
                        <Button
                          size={compact ? 'small' : 'middle'}
                          type="default"
                          onClick={() => pickFromOffer(k, entity)}
                        >
                          {entity.name}{' '}
                          <span style={{ opacity: 0.65, fontSize: 11 }}>({v.base}%)</span>
                        </Button>
                      </Tooltip>
                    )
                  })}
                </Space>
              </Space>
            ) : (
              <Space style={{ marginTop: 8 }}>
                <Button
                  size={compact ? 'small' : 'middle'}
                  onClick={() => genOffer(k)}
                  disabled={GEN_MODIFIER_CATALOG.length === 0}
                >
                  3 варианта
                </Button>
              </Space>
            )}
          </div>
        )
      })}

      {!compact ? (
        <>
          <Divider style={{ margin: '12px 0 8px' }} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            «Двойной удар» 40% → сейчас <strong>{doubleStrikeDemo}%</strong> (Lm из слота с этим типом или первый
            заполненный).
          </Typography.Text>
        </>
      ) : null}
    </Space>
  )
}
