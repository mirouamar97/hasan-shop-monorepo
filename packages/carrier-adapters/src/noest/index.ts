import { StubCarrierAdapter } from '../stub-adapter';

export class NoestAdapter extends StubCarrierAdapter {
  constructor(originWilayaCode = '16') {
    super('noest', 'Noest', originWilayaCode);
  }
}
