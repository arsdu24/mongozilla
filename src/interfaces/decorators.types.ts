export type KlassPropDecorator = <T extends {}, K extends keyof T>(
  target: T,
  propName: K,
) => void;
