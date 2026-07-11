'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ORDER_STATUSES } from '@hasan-shop/shared/constants';
import { AdminShell } from '@/components/admin-shell';
import {
  assignOperator,
  fetchAdminOrder,
  openOrderInvoice,
  openOrderPackingSlip,
  updateInternalNotes,
  updateOrderStatus,
  type AdminOrder,
} from '@/lib/api';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [statusValue, setStatusValue] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError('Missing order id');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAdminOrder(orderId)
      .then((data) => {
        setOrder(data);
        setStatusValue(data.status);
        setOperatorId(data.assignedOperatorId ?? '');
        setInternalNotes(data.internalNotes ?? '');
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load order');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  async function handleStatusUpdate() {
    if (!orderId || !statusValue) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateOrderStatus(orderId, statusValue, statusNote.trim() || undefined);
      setOrder(updated);
      setStatusValue(updated.status);
      setStatusNote('');
      setMessage('Status updated');
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update status');
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignOperator() {
    if (!orderId) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await assignOperator(orderId, operatorId.trim() || null);
      setOrder(updated);
      setOperatorId(updated.assignedOperatorId ?? '');
      setMessage('Operator assigned');
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Failed to assign operator');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveNotes() {
    if (!orderId) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateInternalNotes(orderId, internalNotes);
      setOrder(updated);
      setInternalNotes(updated.internalNotes ?? '');
      setMessage('Internal notes saved');
    } catch (notesError) {
      setError(notesError instanceof Error ? notesError.message : 'Failed to save notes');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title={order ? `Order ${order.orderNumber}` : 'Order Detail'}>
      {loading ? (
        <p className="text-gray-500">Loading order...</p>
      ) : error && !order ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : order ? (
        <div className="max-w-5xl space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={statusBadgeClass(order.status)}>{order.status.replace(/_/g, ' ')}</span>
            <span className="text-sm text-gray-500">
              Created {formatDateTime(order.createdAt)}
            </span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => openOrderInvoice(order.id)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => openOrderPackingSlip(order.id)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Print Packing Slip
              </button>
            </div>
          </div>

          <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold">Customer & Shipping</h3>
              <dl className="space-y-2 text-sm">
                <InfoRow label="Name" value={`${order.shippingFirstName} ${order.shippingLastName}`} />
                <InfoRow label="Phone" value={order.shippingPhone} />
                <InfoRow label="Wilaya" value={`${order.shippingWilayaName} (${order.shippingWilayaCode})`} />
                <InfoRow label="Commune" value={order.shippingCommuneName} />
                <InfoRow label="Address" value={order.shippingAddress} />
                {order.shippingLandmark ? (
                  <InfoRow label="Landmark" value={order.shippingLandmark} />
                ) : null}
                <InfoRow
                  label="Delivery"
                  value={order.shippingDeliveryType === 'stop_desk' ? 'Stop desk' : 'Home delivery'}
                />
                {order.customerNotes ? <InfoRow label="Customer notes" value={order.customerNotes} /> : null}
              </dl>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Payment</h3>
              <dl className="space-y-2 text-sm">
                <InfoRow label="Method" value={order.paymentMethod.toUpperCase()} />
                <InfoRow label="Payment status" value={order.paymentStatus} />
                <InfoRow label="Subtotal" value={`${order.subtotal} DA`} />
                <InfoRow label="Shipping" value={`${order.shippingCost} DA`} />
                {order.discountAmount !== '0.00' && order.discountAmount !== '0' ? (
                  <InfoRow label="Discount" value={`-${order.discountAmount} DA`} />
                ) : null}
                {order.couponCode ? <InfoRow label="Coupon" value={order.couponCode} /> : null}
                <InfoRow label="Total" value={`${order.total} DA`} />
              </dl>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h3 className="border-b bg-gray-50 px-4 py-3 text-sm font-semibold">Items</h3>
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 font-medium">Qty</th>
                  <th className="px-4 py-2 font-medium">Unit</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {item.name}
                      {item.variantName ? (
                        <span className="block text-xs text-gray-500">{item.variantName}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.unitPrice} DA</td>
                    <td className="px-4 py-3">{item.totalPrice} DA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">Status Timeline</h3>
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No status history yet</p>
            ) : (
              <ol className="space-y-3 border-l-2 border-gray-200 pl-4">
                {[...order.statusHistory]
                  .sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                  )
                  .map((entry) => (
                    <li key={entry.id} className="relative text-sm">
                      <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                      <p className="font-medium">
                        {entry.fromStatus ? `${entry.fromStatus} → ` : ''}
                        {entry.toStatus.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(entry.createdAt)}
                        {entry.actorName ? ` · ${entry.actorName}` : ''}
                      </p>
                      {entry.note ? <p className="mt-1 text-gray-600">{entry.note}</p> : null}
                    </li>
                  ))}
              </ol>
            )}
          </section>

          <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Change Status</h3>
              <select
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <input
                value={statusNote}
                onChange={(event) => setStatusNote(event.target.value)}
                placeholder="Optional note"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={busy || statusValue === order.status}
                onClick={() => void handleStatusUpdate()}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Update Status
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Assign Operator</h3>
              <input
                value={operatorId}
                onChange={(event) => setOperatorId(event.target.value)}
                placeholder="Operator UUID (leave empty to unassign)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {order.assignedOperatorName ? (
                <p className="text-xs text-gray-500">Current: {order.assignedOperatorName}</p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleAssignOperator()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Save Operator
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold">Internal Notes</h3>
            <textarea
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Staff-only notes..."
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSaveNotes()}
              className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Save Notes
            </button>
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}

          <button
            type="button"
            onClick={() => router.push('/dashboard/orders')}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm"
          >
            Back to orders
          </button>
        </div>
      ) : null}
    </AdminShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function statusBadgeClass(status: string): string {
  const base = 'rounded-full px-2 py-0.5 text-xs font-medium';
  switch (status) {
    case 'pending':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'confirmed':
    case 'preparing':
    case 'ready_to_ship':
      return `${base} bg-blue-100 text-blue-800`;
    case 'shipped':
    case 'delivered':
      return `${base} bg-indigo-100 text-indigo-800`;
    case 'completed':
      return `${base} bg-green-100 text-green-800`;
    case 'cancelled':
    case 'customer_refused':
    case 'failed_delivery':
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('fr-DZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
