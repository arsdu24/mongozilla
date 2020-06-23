export type KlassPropDecorator = <T extends object, K extends keyof T>(
  target: T,
  propName: K,
) => void;
