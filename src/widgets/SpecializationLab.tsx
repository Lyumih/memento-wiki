import { Card, Descriptions, Select, Slider, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import {
  cardLevelUpSuccessProbability,
  cardLevelUpSuccessProbabilityWithBonus,
} from '@/memento/cardLevelUpStats'
import {
  DEMO_SPECIALIZATION_PRESETS,
  resolveMementoSpecialization,
} from '@/memento/mementoSpecialization'
import { modifierSlotUnlockLevel } from '@/memento/modifierSlots'

const PRESET_OPTIONS = Object.keys(DEMO_SPECIALIZATION_PRESETS).map((key) => ({
  label: key,
  value: key,
}))

function formatP(p: number): string {
  return `${(p * 100).toFixed(2)}%`
}

export function SpecializationLab() {
  const [presetKey, setPresetKey] = useState<string>('base')
  const [cardLevel, setCardLevel] = useState(75)

  const eff = useMemo(() => {
    const raw = DEMO_SPECIALIZATION_PRESETS[presetKey]
    if (!raw) return resolveMementoSpecialization({})
    return resolveMementoSpecialization(raw)
  }, [presetKey])

  const pBase = cardLevelUpSuccessProbability(cardLevel)
  const pSpec = cardLevelUpSuccessProbabilityWithBonus(cardLevel, eff.levelUpBonusSteps)

  const slotLabels = [0, 1, 2].map(
    (k) => `Слот ${k + 1}: L ≥ ${modifierSlotUnlockLevel(k, eff)}`,
  )

  return (
    <Space
      orientation="vertical"
      size="large"
      style={{ width: '100%', marginTop: 16, display: 'flex', flexDirection: 'column' }}
      styles={{ item: { width: '100%', maxWidth: '100%', minWidth: 0 } }}
    >
      <Card title="Лаборатория специализации (демо)" size="small">
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text strong>Пресет: </Typography.Text>
            <Select
              style={{ minWidth: 200 }}
              options={PRESET_OPTIONS}
              value={presetKey}
              onChange={setPresetKey}
            />
          </div>
          <div>
            <Typography.Text strong>Уровень карты L: {cardLevel}</Typography.Text>
            <Slider min={1} max={300} value={cardLevel} onChange={setCardLevel} />
          </div>
          <Descriptions bordered size="small" column={1} title="Эффективные параметры">
            <Descriptions.Item label="levelUpBonusSteps">{eff.levelUpBonusSteps}</Descriptions.Item>
            <Descriptions.Item label="modifierOfferCount">{eff.modifierOfferCount}</Descriptions.Item>
            <Descriptions.Item label="firstModifierSlotLevel">{eff.firstModifierSlotLevel}</Descriptions.Item>
            <Descriptions.Item label="modifierSlotStep">{eff.modifierSlotStep}</Descriptions.Item>
            <Descriptions.Item label="previewNextModifierOffer">
              {eff.previewNextModifierOffer ? 'да' : 'нет'}
            </Descriptions.Item>
          </Descriptions>
          <Descriptions bordered size="small" column={1} title="Вероятность успеха одного броска (рост L)">
            <Descriptions.Item label="База (без бонуса шагов)">{formatP(pBase)}</Descriptions.Item>
            <Descriptions.Item label="С пресетом (§3.1 спеки)">{formatP(pSpec)}</Descriptions.Item>
          </Descriptions>
          <Typography.Text type="secondary">
            Пороги слотов при выбранном пресете: {slotLabels.join(' · ')}
          </Typography.Text>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
            Минимальный контракт §7 спеки `2026-04-02-memento-specialization-design`: без симуляции оффера
            модификаторов; `modifierOfferCount` влияет на продукцию через `pickModifierOffer` при открытии слота.
          </Typography.Paragraph>
        </Space>
      </Card>
    </Space>
  )
}
