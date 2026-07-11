import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { YalidineAdapter } from './index';

const config = {
  apiId: 'test-api-id',
  apiToken: 'test-api-token',
  originWilayaCode: '16',
};

const shippingRateRequest = {
  carrier: 'yalidine' as const,
  fromWilayaCode: '16',
  toWilayaCode: '31',
  toCommuneCode: '3101',
  weightKg: 1,
  codAmount: 5000,
  deliveryType: 'home' as const,
};

const createShipmentRequest = {
  orderId: 'order-1',
  orderReference: 'HS-20260710-0001',
  carrier: 'yalidine' as const,
  address: {
    firstName: 'Ali',
    lastName: 'Ben',
    phone: '0555123456',
    wilayaCode: '31',
    wilayaName: 'Oran',
    communeCode: '3101',
    communeName: 'Oran',
    address: '12 Rue Example',
    deliveryType: 'home' as const,
  },
  codAmount: 5600,
  declaredValue: 5000,
  dimensions: { weightKg: 1.5 },
  productDescription: 'Test items',
  freeShipping: false,
  originWilayaCode: '16',
};

function mockFetchResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
    json: vi.fn().mockResolvedValue(body),
  });
}

describe('YalidineAdapter', () => {
  let adapter: YalidineAdapter;

  beforeEach(() => {
    adapter = new YalidineAdapter(config);
    vi.stubGlobal('fetch', mockFetchResponse([]));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.WEBHOOK_SECRET_YALIDINE;
    delete process.env.WEBHOOK_SECRET_DEFAULT;
  });

  it('uses default API URL when apiUrl is omitted', () => {
    expect(adapter.slug).toBe('yalidine');
    expect(adapter.displayName).toBe('Yalidine');
  });

  it('uses custom API URL when provided', async () => {
    const customAdapter = new YalidineAdapter({
      ...config,
      apiUrl: 'https://custom.yalidine.test/v1',
    });
    vi.stubGlobal('fetch', mockFetchResponse([]));

    await customAdapter.testConnection();

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.yalidine.test/v1/wilayas/',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-API-ID': config.apiId,
          'X-API-TOKEN': config.apiToken,
        }),
      }),
    );
  });

  describe('testConnection', () => {
    it('returns true when wilayas endpoint succeeds', async () => {
      vi.stubGlobal('fetch', mockFetchResponse([{ id: 16, name: 'Alger' }]));

      await expect(adapter.testConnection()).resolves.toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.yalidine.app/v1/wilayas/',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('returns false when API returns an error', async () => {
      vi.stubGlobal('fetch', mockFetchResponse('Unauthorized', false, 401));

      await expect(adapter.testConnection()).resolves.toBe(false);
    });
  });

  describe('calculateRate', () => {
    it('maps fee response to shipping rate result', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse({
          from_wilaya_name: 'Alger',
          to_wilaya_name: 'Oran',
          price: 850,
          estimated_days: 5,
        }),
      );

      const rate = await adapter.calculateRate(shippingRateRequest);

      expect(rate).toEqual({
        carrier: 'yalidine',
        price: 850,
        currency: 'DZD',
        estimatedDays: 5,
        deliveryType: 'home',
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/fees/?from_wilaya_id=16&to_wilaya_id=31&to_commune_id=3101'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('defaults estimatedDays to 3 when not provided', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse({
          from_wilaya_name: 'Alger',
          to_wilaya_name: 'Oran',
          price: 600,
        }),
      );

      const rate = await adapter.calculateRate(shippingRateRequest);

      expect(rate.estimatedDays).toBe(3);
    });

    it('throws when fees endpoint fails', async () => {
      vi.stubGlobal('fetch', mockFetchResponse('Bad request', false, 400));

      await expect(adapter.calculateRate(shippingRateRequest)).rejects.toThrow(
        'Yalidine API error (400)',
      );
    });
  });

  describe('createShipment', () => {
    it('creates a home-delivery parcel', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse({
          tracking: 'YAL123456',
          label: 'https://labels.yalidine.test/YAL123456.pdf',
          order_id: 'HS-20260710-0001',
        }),
      );

      const result = await adapter.createShipment(createShipmentRequest);

      expect(result).toEqual({
        trackingNumber: 'YAL123456',
        labelUrl: 'https://labels.yalidine.test/YAL123456.pdf',
        carrierParcelId: 'YAL123456',
        estimatedDeliveryDays: 3,
      });

      const [, options] = vi.mocked(fetch).mock.calls[0]!;
      const body = JSON.parse(String(options?.body));

      expect(body).toMatchObject({
        order_id: 'HS-20260710-0001',
        firstname: 'Ali',
        familyname: 'Ben',
        is_stopdesk: false,
        do_insurance: false,
        freeshipping: false,
      });
    });

    it('creates a stop-desk parcel with insurance for high declared value', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse({
          tracking: 'YAL999999',
        }),
      );

      await adapter.createShipment({
        ...createShipmentRequest,
        declaredValue: 15000,
        freeShipping: true,
        address: {
          ...createShipmentRequest.address,
          deliveryType: 'stop_desk',
          stopDeskId: 'desk-42',
        },
      });

      const [, options] = vi.mocked(fetch).mock.calls[0]!;
      const body = JSON.parse(String(options?.body));

      expect(body).toMatchObject({
        is_stopdesk: true,
        stopdesk_id: 'desk-42',
        do_insurance: true,
        declared_value: 15000,
        freeshipping: true,
      });
    });
  });

  describe('getTracking', () => {
    it('maps history events to shipment status events', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse({
          history: [
            {
              status: 'in_transit',
              message: 'Parcel in transit',
              date: '2026-07-10T10:00:00Z',
              location: 'Alger',
            },
            {
              status: 'delivered',
              date: '2026-07-11T14:00:00Z',
            },
          ],
        }),
      );

      const events = await adapter.getTracking('YAL123456');

      expect(events).toEqual([
        {
          trackingNumber: 'YAL123456',
          status: 'in_transit',
          statusLabel: 'Parcel in transit',
          timestamp: '2026-07-10T10:00:00Z',
          location: 'Alger',
        },
        {
          trackingNumber: 'YAL123456',
          status: 'delivered',
          statusLabel: 'delivered',
          timestamp: '2026-07-11T14:00:00Z',
          location: undefined,
        },
      ]);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.yalidine.app/v1/parcels/YAL123456/history',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('returns empty array when history is missing', async () => {
      vi.stubGlobal('fetch', mockFetchResponse({}));

      await expect(adapter.getTracking('YAL000000')).resolves.toEqual([]);
    });
  });

  describe('verifyWebhookSignature', () => {
    const secret = 'yalidine-webhook-secret';

    function signPayload(payload: string, fields: { timestamp?: string; nonce?: string } = {}) {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const timestamp = fields.timestamp ?? String(parsed.timestamp ?? '');
      const nonce = fields.nonce ?? String(parsed.nonce ?? '');
      return createHmac('sha256', secret)
        .update(`${timestamp}.${nonce}.${payload}`)
        .digest('hex');
    }

    it('returns false when no webhook secret is configured', () => {
      const payload = JSON.stringify({ timestamp: '123', nonce: 'abc' });

      expect(adapter.verifyWebhookSignature(payload, 'deadbeef')).toBe(false);
    });

    it('returns true for a valid signature using WEBHOOK_SECRET_YALIDINE', () => {
      process.env.WEBHOOK_SECRET_YALIDINE = secret;
      const payload = JSON.stringify({ timestamp: '1710000000', nonce: 'evt-1', data: {} });
      const signature = signPayload(payload);

      expect(adapter.verifyWebhookSignature(payload, signature)).toBe(true);
      expect(adapter.verifyWebhookSignature(payload, `sha256=${signature}`)).toBe(true);
    });

    it('falls back to WEBHOOK_SECRET_DEFAULT', () => {
      process.env.WEBHOOK_SECRET_DEFAULT = secret;
      const payload = JSON.stringify({ event_time: '1710000001', event_id: 'evt-2' });
      const signature = createHmac('sha256', secret)
        .update(`1710000001.evt-2.${payload}`)
        .digest('hex');

      expect(adapter.verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('returns false for invalid signature or malformed payload', () => {
      process.env.WEBHOOK_SECRET_YALIDINE = secret;
      const payload = JSON.stringify({ timestamp: '1710000000', nonce: 'evt-1' });

      expect(adapter.verifyWebhookSignature(payload, 'invalid-signature')).toBe(false);
      expect(adapter.verifyWebhookSignature('{not-json', 'deadbeef')).toBe(false);
    });
  });
});
