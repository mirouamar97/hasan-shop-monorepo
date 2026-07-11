import { StubCarrierAdapter } from '../stub-adapter';

export class EcotrackAdapter extends StubCarrierAdapter {
  constructor(originWilayaCode = '16') {
    super('ecotrack', 'Ecotrack', originWilayaCode);
  }
}
