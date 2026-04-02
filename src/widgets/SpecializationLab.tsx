import { Alert, Card, Descriptions, Select, Slider, Space, Table, Typography } from 'antd'
import { useMemo, useState } from 'react'
import {
  cardLevelUpSuccessProbability,
  cardLevelUpSuccessProbabilityWithBonus,
} from '@/memento/cardLevelUpStats'
import {
  DEMO_SPECIALIZATION_PRESET_DISPLAY,
  DEMO_SPECIALIZATION_PRESET_ORDER,
  DEMO_SPECIALIZATION_PRESETS,
  resolveMementoSpecialization,
} from '@/memento/mementoSpecialization'
import { modifierSlotUnlockLevel } from '@/memento/modifierSlots'

import type { DemoSpecializationPresetKey } from '@/memento/mementoSpecialization'

const SELECT_OPTIONS = DEMO_SPECIALIZATION_PRESET_ORDER.map((key) => {
  const d = DEMO_SPECIALIZATION_PRESET_DISPLAY[key]
  return {
    value: key,
    label: `${d.title} (${key})`,
  }
})

function formatP(p: number): string {
  return `${(p * 100).toFixed(2)}%`
}

export function SpecializationLab() {
  const [presetKey, setPresetKey] = useState<DemoSpecializationPresetKey>('base')
  const [cardLevel, setCardLevel] = useState(75)

  const display = DEMO_SPECIALIZATION_PRESET_DISPLAY[presetKey]

  const eff = useMemo(() => {
    const raw = DEMO_SPECIALIZATION_PRESETS[presetKey]
    if (!raw) return resolveMementoSpecialization({})
    return resolveMementoSpecialization(raw)
  }, [presetKey])

  const pBase = cardLevelUpSuccessProbability(cardLevel)
  const pSpec = cardLevelUpSuccessProbabilityWithBonus(cardLevel, eff.levelUpBonusSteps)

  const L_eff =
    cardLevel > 100 ? null : Math.max(1, cardLevel - eff.levelUpBonusSteps)

  const slotLabels = [0, 1, 2].map(
    (k) => `слот ${k + 1}: L ≥ ${modifierSlotUnlockLevel(k, eff)}`,
  )

  const comparisonRows = useMemo(
    () =>
      DEMO_SPECIALIZATION_PRESET_ORDER.map((key) => {
        const e = resolveMementoSpecialization(DEMO_SPECIALIZATION_PRESETS[key] ?? {})
        const meta = DEMO_SPECIALIZATION_PRESET_DISPLAY[key]
        return {
          key,
          title: meta.title,
          offer: e.modifierOfferCount,
          firstSlot: e.firstModifierSlotLevel,
          bonus: e.levelUpBonusSteps,
          preview: e.previewNextModifierOffer ? 'да' : 'нет',
        }
      }),
    [],
  )

  return (
    <Space
      orientation="vertical"
      size="large"
      style={{ width: '100%', marginTop: 16, display: 'flex', flexDirection: 'column' }}
      styles={{ item: { width: '100%', maxWidth: '100%', minWidth: 0 } }}
    >
      <Alert
        type="info"
        showIcon
        title="Как читать эту страницу"
        description={
          <span>
            Здесь нет «готовых классов из игры» — только <strong>иллюстративные пресеты</strong> из дизайн-спеки:
            они показывают, <em>какие числа</em> может менять специализация (оффер, пороги слотов, бонус к броску,
            предпросмотр). Выберите пресет и уровень <Typography.Text code>L</Typography.Text>, чтобы увидеть
            эффект на вероятность успеха броска и на пороги слотов.
          </span>
        }
      />

      <Card title="Сравнение всех демо-специализаций" size="small">
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Одна таблица — чтобы сразу увидеть отличия. Ключи в скобках в селекте ниже совпадают с колонкой «ключ» в
          коде.
        </Typography.Paragraph>
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          scroll={{ x: true }}
          columns={[
            { title: 'Название', dataIndex: 'title', key: 'title' },
            { title: 'Ключ', dataIndex: 'key', key: 'key', render: (k: string) => <Typography.Text code>{k}</Typography.Text> },
            { title: 'Вариантов в оффере', dataIndex: 'offer', key: 'offer', align: 'right' },
            {
              title: '1-й слот при L ≥',
              dataIndex: 'firstSlot',
              key: 'firstSlot',
              align: 'right',
            },
            {
              title: 'Бонус шагов к броску',
              dataIndex: 'bonus',
              key: 'bonus',
              align: 'right',
            },
            { title: 'Предпросмотр оффера', dataIndex: 'preview', key: 'preview' },
          ]}
          dataSource={comparisonRows}
        />
      </Card>

      <Card title="Лаборатория: один пресет подробно" size="small">
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text strong>Специализация: </Typography.Text>
            <Select<DemoSpecializationPresetKey>
              style={{ minWidth: 280 }}
              options={SELECT_OPTIONS}
              value={presetKey}
              onChange={setPresetKey}
            />
          </div>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            <Typography.Text strong>{display.title}.</Typography.Text> {display.summary}
          </Typography.Paragraph>
          <div>
            <Typography.Text strong>Уровень карты L: {cardLevel}</Typography.Text>
            <Slider min={1} max={300} value={cardLevel} onChange={setCardLevel} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Подстройте L, чтобы сравнить шанс броска «как в базе» и с учётом бонуса шагов пресета.
            </Typography.Text>
          </div>
          <Descriptions bordered size="small" column={1} title="Эффективные параметры (после слияния с базой)">
            <Descriptions.Item label="Бонус шагов к броску L / Lm">
              {eff.levelUpBonusSteps}
              <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                (levelUpBonusSteps)
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Число вариантов в оффере слота">
              {eff.modifierOfferCount}
            </Descriptions.Item>
            <Descriptions.Item label="Порог L для первого слота">
              {eff.firstModifierSlotLevel}
            </Descriptions.Item>
            <Descriptions.Item label="Шаг L между следующими слотами">
              {eff.modifierSlotStep}
            </Descriptions.Item>
            <Descriptions.Item label="Предпросмотр следующего оффера">
              {eff.previewNextModifierOffer ? 'да' : 'нет'}
            </Descriptions.Item>
            {L_eff !== null && eff.levelUpBonusSteps > 0 && (
              <Descriptions.Item label="Эффективный уровень для формулы броска (L ≤ 100)">
                L_eff = max(1, L − бонус) = <Typography.Text strong>{L_eff}</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>
          <Descriptions bordered size="small" column={1} title="Вероятность успеха одного броска (рост уровня карты)">
            <Descriptions.Item label="Без бонуса шагов (база Gen)">{formatP(pBase)}</Descriptions.Item>
            <Descriptions.Item label="С выбранным пресетом">{formatP(pSpec)}</Descriptions.Item>
          </Descriptions>
          <Typography.Text type="secondary">
            Пороги первых трёх слотов: {slotLabels.join(' · ')}.
          </Typography.Text>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
            Симуляция выпадения модификаторов здесь не показывается: число карточек в оффере задаётся полем выше и
            используется в коде через <Typography.Text code>pickModifierOffer</Typography.Text> при открытии слота.
          </Typography.Paragraph>
        </Space>
      </Card>
    </Space>
  )
}
