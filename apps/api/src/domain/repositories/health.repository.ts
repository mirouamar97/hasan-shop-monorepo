export interface IHealthRepository {
  ping(): Promise<void>;
}
