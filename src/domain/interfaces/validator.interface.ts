export interface ValidatorService<T> {
  validate(value: T): boolean;
}
