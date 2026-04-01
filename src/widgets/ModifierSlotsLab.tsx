import { Button, Card, InputNumber, Slider, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
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

export function ModifierSlotsLab() {
  const [cardLevel, setCardLevel] = useState(75)
  const [lm, setLm] = useState(1)
  const [lastR, setLastR] = useState<number | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)
  const [offerPicks, setOfferPicks] = useState<DbEntity[] | null>(null)

  const unlocked = modifierUnlockedSlotCount(cardLevel)
  const slotThresholds = useMemo(
    () => [0, 1, 2].map((k) => ({ k, need: modifierSlotUnlockLevel(k) })),
    [],
  )

  const catalogPoolLabel = useMemo(
    () => GEN_MODIFIER_CATALOG.map((m) => m.name).join(' · '),
    [],
  )

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
    if (GEN_MODIFIER_CATALOG.length === 0) return
    const picks = pickModifierOffer(GEN_MODIFIER_CATALOG, 3, (n) => Math.floor(Math.random() * n))
    setOfferPicks(picks)
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
          title="Оффер из каталога (Gen)"
          size="small"
          style={{ flex: '1 1 280px', minWidth: 0, width: '100%', maxWidth: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Пул — записи <Typography.Text code>/db/mods</Typography.Text> с{' '}
              <Typography.Text code>game: gen</Typography.Text>: {catalogPoolLabel}
            </Typography.Text>
            <Button onClick={genOffer} disabled={GEN_MODIFIER_CATALOG.length === 0}>
              Сгенерировать 3 варианта
            </Button>
            {offerPicks ? (
              <Typography.Text>
                Варианты:{' '}
                <strong>{offerPicks.map((p) => p.name).join(' · ')}</strong>
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
