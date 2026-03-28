/**
 * Mermaid source for the Memento Mori “three axes + run loop” map (homepage).
 * Keep syntax compatible with mermaid ^11.
 */
export const mementoSystemMapMermaid = `
flowchart TB
  subgraph cycle["Цикл забегов"]
    direction TB
    Z[Забег] --> I{Исход}
    I --> M[Мета-прогресс]
    M --> Z
  end
  subgraph axes["Три направления роста"]
    direction TB
    A[Мета и сила мира]
    B[Карты и умения в бою]
    C[Победа и модификации]
  end
  Z -.-> A
  Z -.-> B
  Z -.-> C
`.trim()
