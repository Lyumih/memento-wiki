import { expectedRollsForOneSuccess } from '@/memento/cardLevelUpStats'

const L_MIN = 1
const L_MAX = 200
const Y_MAX = 100

function buildPoints(): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (let L = L_MIN; L <= L_MAX; L++) {
    pts.push({ x: L, y: expectedRollsForOneSuccess(L) })
  }
  return pts
}

/** SVG: E₁(L) для L = 1…200 (ожидание бросков до одного успеха). */
export function LevelUpExpectationChart() {
  const points = buildPoints()
  const padL = 52
  const padR = 16
  const padT = 20
  const padB = 44
  const innerW = 520
  const innerH = 200
  const W = padL + innerW + padR
  const H = padT + innerH + padB

  const toPx = (L: number, e: number) => {
    const px = padL + ((L - L_MIN) / (L_MAX - L_MIN)) * innerW
    const py = padT + (1 - Math.min(e, Y_MAX) / Y_MAX) * innerH
    return { px, py }
  }

  const d = points
    .map((p, i) => {
      const { px, py } = toPx(p.x, p.y)
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`
    })
    .join(' ')

  const xTicks = [1, 50, 100, 150, 200]
  const yTicks = [0, 25, 50, 75, 100]

  return (
    <figure className="level-up-expectation-chart" style={{ margin: '1.25rem 0' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="График: уровень L от 1 до 200 по горизонтали, ожидание числа бросков E₁(L) до одного успеха по вертикали"
      >
        <title>E₁(L): ожидание бросков до одного успешного повышения уровня</title>
        {/* Grid & Y ticks */}
        {yTicks.map((yv) => {
          const { py } = toPx(L_MIN, yv)
          return (
            <g key={`y-${yv}`}>
              <line
                x1={padL}
                x2={padL + innerW}
                y1={py}
                y2={py}
                stroke="currentColor"
                strokeOpacity={0.12}
              />
              <text
                x={padL - 8}
                y={py + 4}
                textAnchor="end"
                fontSize={11}
                fill="currentColor"
                fillOpacity={0.7}
              >
                {yv}
              </text>
            </g>
          )
        })}
        {/* X ticks */}
        {xTicks.map((xv) => {
          const { px } = toPx(xv, 0)
          return (
            <text
              key={`x-${xv}`}
              x={px}
              y={H - 12}
              textAnchor="middle"
              fontSize={11}
              fill="currentColor"
              fillOpacity={0.7}
            >
              {xv}
            </text>
          )
        })}
        <line
          x1={padL}
          x2={padL}
          y1={padT}
          y2={padT + innerH}
          stroke="currentColor"
          strokeOpacity={0.35}
        />
        <line
          x1={padL}
          x2={padL + innerW}
          y1={padT + innerH}
          y2={padT + innerH}
          stroke="currentColor"
          strokeOpacity={0.35}
        />
        <path
          d={d}
          fill="none"
          stroke="var(--accent, #aa3bff)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <text
          x={padL + innerW / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={12}
          fill="currentColor"
          fillOpacity={0.85}
        >
          Уровень L
        </text>
        <text
          x={14}
          y={padT + innerH / 2}
          textAnchor="middle"
          fontSize={12}
          fill="currentColor"
          fillOpacity={0.85}
          transform={`rotate(-90 14 ${padT + innerH / 2})`}
        >
          E₁(L)
        </text>
      </svg>
      <figcaption style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: 8 }}>
        Ожидание числа бросков до одного успеха (не кумулятив до целевого уровня). Масштаб по вертикали 0…100
        совпадает с максимумом E₁ при L ≥ 100.
      </figcaption>
    </figure>
  )
}
