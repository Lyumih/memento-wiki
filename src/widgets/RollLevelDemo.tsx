import { Card, Slider, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { rollCardLevelUp } from '@/memento/rollCardLevelUp'

export function RollLevelDemo() {
  const [level, setLevel] = useState(1)
  const [r, setR] = useState(50)
  const ok = useMemo(() => rollCardLevelUp(level, r), [level, r])

  return (
    <Card title="Бросок улучшения уровня карты" size="small" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text>Текущий уровень карты: {level}</Typography.Text>
        <Slider min={1} max={200} value={level} onChange={setLevel} />
        <Typography.Text>Случайное r (1–100): {r}</Typography.Text>
        <Slider min={1} max={100} marks={{ 1: '1', 100: '100' }} value={r} onChange={setR} />
        <Typography.Text strong type={ok ? 'success' : undefined}>
          {ok ? 'Успех: +1 уровень' : 'Без улучшения'}
        </Typography.Text>
        <Typography.Text type="secondary">
          Правило как в gen-game-design, раздел 4.3
        </Typography.Text>
      </Space>
    </Card>
  )
}
