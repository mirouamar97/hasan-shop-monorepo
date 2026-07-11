export const VIRUS_SCANNER = Symbol('VIRUS_SCANNER');

export type VirusScanResult = {
  clean: boolean;
  threat?: string;
};

export interface VirusScanner {
  scan(buffer: Buffer, filename: string): Promise<VirusScanResult>;
}
