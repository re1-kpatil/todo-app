export type MergeFunctions<F1, F2> = F1 extends (arg: infer A1) => infer R1
  ? F2 extends (arg: infer A2) => infer R2
    ? R1 extends Promise<unknown>
      ? (arg?: A1 & A2) => Promise<Awaited<R1> & Awaited<R2>>
      : (arg?: A1 & A2) => R1 & R2
    : never
  : never;
