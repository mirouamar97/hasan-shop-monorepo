import { StubCarrierAdapter } from '../stub-adapter';

export class ZrExpressAdapter extends StubCarrierAdapter {
  constructor(originWilayaCode = '16') {
    super('zr_express', 'ZR Express', originWilayaCode);
  }
}
