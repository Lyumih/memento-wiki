import { Button, Card, InputNumber, Slider, Space, Table, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { rollCardLevelUp } from '@/memento/rollCardLevelUp'
import {
  expectedRollsToReachLevel,
  MILESTONES_HIGH,
  MILESTONES_LOW,
} from '@/memento/cardLevelUpStats'
import { LevelUpExpectationChart } from '@/widgets/LevelUpExpectationChart'
import { PercentTokenDemo } from '@/widgets/PercentTokenDemo'

function formatExpectation(value: number): string {
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e7) return value.toExponential(2)
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)
}

export function MementoRollLab() {
  const [startLevel, setStartLevel] = useState(1)
  const [emulLevel, setEmulLevel] = useState(1)
  const [lastR, setLastR] = useState<number | null>(null)
  const [lastOk, setLastOk] = useState<boolean | null>(null)

  const lowColumns = useMemo(
    () => [
      {
        title: ' ',
        dataIndex: 'label',
        key: 'label',
        fixed: 'left' as const,
        width: 200,
      },
      ...MILESTONES_LOW.map((T) => ({
        title: String(T),
        dataIndex: `m${T}`,
        key: `m${T}`,
        align: 'right' as const,
      })),
    ],
    [],
  )

  const lowRow = useMemo(() => {
    const row: Record<string, string> = { key: 'low', label: 'E_cum(S, T), ожидание бросков' }
    for (const T of MILESTONES_LOW) {
      row[`m${T}`] = formatExpectation(expectedRollsToReachLevel(startLevel, T))
    }
    return [row]
  }, [startLevel])

  const highColumns = useMemo(
    () => [
      {
        title: ' ',
        dataIndex: 'label',
        key: 'label',
        fixed: 'left' as const,
        width: 200,
      },
      ...MILESTONES_HIGH.map((T) => ({
        title: String(T),
        dataIndex: `m${T}`,
        key: `m${T}`,
        align: 'right' as const,
      })),
    ],
    [],
  )

  const highRow = useMemo(() => {
    const row: Record<string, string> = { key: 'high', label: 'E_cum(S, T), ожидание бросков' }
    for (const T of MILESTONES_HIGH) {
      row[`m${T}`] = formatExpectation(expectedRollsToReachLevel(startLevel, T))
    }
    return [row]
  }, [startLevel])

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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
      <Card title="Эмуляция уровня карты" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>
            Старт для таблиц и сброса S (1–999): {startLevel}
          </Typography.Text>
          <Slider
            min={1}
            max={999}
            value={startLevel}
            onChange={setStartLevel}
            marks={{ 1: '1', 250: '250', 500: '500', 750: '750', 999: '999' }}
          />
          <Space wrap>
            <Typography.Text>С:</Typography.Text>
            <InputNumber min={1} max={999} value={startLevel} onChange={(v) => setStartLevel(v ?? 1)} />
          </Space>
          <Typography.Text strong>Текущий уровень эмуляции L: {emulLevel}</Typography.Text>
          <Space wrap>
            <Button type="primary" onClick={tryLevelUp}>
              Поднять уровень
            </Button>
            <Button onClick={resetLevel}>Сбросить уровень</Button>
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

      <PercentTokenDemo level={emulLevel} />

      <section>
        <Typography.Title level={4}>График E₁(L)</Typography.Title>
        <LevelUpExpectationChart />
      </section>

      <section>
        <Typography.Title level={4}>Ожидание бросков от старта S до вехи T</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          Если T ≤ S, ожидание 0 (цель не выше старта). Веха 100 приведена в обеих таблицах намеренно.
        </Typography.Paragraph>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          Вехи 10…100 (колонки — цель T)
        </Typography.Text>
        <Table
          size="small"
          pagination={false}
          columns={lowColumns}
          dataSource={lowRow}
          scroll={{ x: 'max-content' }}
        />
        <Typography.Text strong style={{ display: 'block', margin: '16px 0 8px' }}>
          Вехи 100…1000 (колонки — цель T)
        </Typography.Text>
        <Table
          size="small"
          pagination={false}
          columns={highColumns}
          dataSource={highRow}
          scroll={{ x: 'max-content' }}
        />
      </section>
    </Space>
  )
}
