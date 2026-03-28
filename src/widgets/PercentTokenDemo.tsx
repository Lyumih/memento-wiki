import { Card, Input, Slider, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { resolvePercentToken } from '@/memento/resolvePercentToken'

export function PercentTokenDemo() {
  const [level, setLevel] = useState(0)
  const [token, setToken] = useState('40%%')
  const val = useMemo(
    () => resolvePercentToken(level, token.trim()),
    [level, token],
  )

  return (
    <Card title="Токен %%" size="small" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text>Строка токена</Typography.Text>
        <Input value={token} onChange={(e) => setToken(e.target.value)} />
        <Typography.Text>Уровень карточки L: {level}</Typography.Text>
        <Slider min={0} max={200} value={level} onChange={setLevel} />
        <Typography.Text strong>
          Значение: {val === null ? 'некорректный токен или L' : val}
        </Typography.Text>
      </Space>
    </Card>
  )
}
