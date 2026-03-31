import type { CSSProperties } from 'react'
import { Card, Input, Slider, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { resolvePercentToken } from '@/memento/resolvePercentToken'

type PercentTokenDemoProps = {
  /** Если задан — уровень снаружи, без слайдера (например эмуляция на странице memento-roll). */
  level?: number
  /** Без верхнего отступа карточки (например в горизонтальном ряду с эмуляцией). */
  noOuterMargin?: boolean
}

export function PercentTokenDemo({ level: levelProp, noOuterMargin }: PercentTokenDemoProps = {}) {
  const [internalLevel, setInternalLevel] = useState(0)
  const [token, setToken] = useState('40%%')
  const level = levelProp !== undefined ? levelProp : internalLevel
  const val = useMemo(
    () => resolvePercentToken(level, token.trim()),
    [level, token],
  )

  const cardStyle: CSSProperties | undefined = noOuterMargin
    ? { width: '100%', maxWidth: '100%', minWidth: 0, flex: 1 }
    : { marginTop: 16 }

  return (
    <Card title="Токен %%" size="small" style={cardStyle}>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Typography.Text>Строка токена</Typography.Text>
        <Input value={token} onChange={(e) => setToken(e.target.value)} />
        <Typography.Text>Уровень карточки L: {level}</Typography.Text>
        {levelProp === undefined ? (
          <Slider min={0} max={200} value={internalLevel} onChange={setInternalLevel} />
        ) : null}
        <Typography.Text strong>
          Значение: {val === null ? 'некорректный токен или L' : val}
        </Typography.Text>
      </Space>
    </Card>
  )
}
