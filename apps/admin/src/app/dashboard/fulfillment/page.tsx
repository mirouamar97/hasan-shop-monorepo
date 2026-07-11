'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import {
  completeFulfillmentStage,
  fetchFulfillmentWorkflow,
  type FulfillmentStage,
  type FulfillmentTask,
} from '@/lib/api';

const STAGE_LABELS: Record<FulfillmentStage, string> = {
  picking: 'Picking',
  packing: 'Packing',
  quality_check: 'Quality check',
  ready_to_ship: 'Ready to ship',
};

const STAGE_ORDER: FulfillmentStage[] = ['picking', 'packing', 'quality_check', 'ready_to_ship'];

export default function FulfillmentPage() {
  const [orderId, setOrderId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tasks, setTasks] = useState<FulfillmentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function searchWorkflow(event?: React.FormEvent) {
    event?.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      return;
    }

    setLoading(true);
    setError('');
    setOrderId(trimmed);
    try {
      const data = await fetchFulfillmentWorkflow(trimmed);
      setTasks(data);
    } catch (loadError) {
      setTasks([]);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteStage(stage: FulfillmentStage) {
    if (!orderId) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      await completeFulfillmentStage(orderId, stage);
      const data = await fetchFulfillmentWorkflow(orderId);
      setTasks(data);
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Failed to complete stage');
    } finally {
      setBusy(false);
    }
  }

  const taskByStage = new Map(tasks.map((task) => [task.stage, task]));

  return (
    <AdminShell title="Fulfillment">
      <form onSubmit={searchWorkflow} className="mb-6 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Order ID</span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Enter order UUID..."
            className="w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !searchInput.trim()}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Load workflow
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && orderId && tasks.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Workflow for order <span className="font-mono font-medium">{orderId}</span>
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {STAGE_ORDER.map((stage) => {
              const task = taskByStage.get(stage);
              return (
                <div
                  key={stage}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">{STAGE_LABELS[stage]}</h3>
                    <span className={statusBadgeClass(task?.status ?? 'pending')}>
                      {(task?.status ?? 'pending').replace(/_/g, ' ')}
                    </span>
                  </div>
                  {task?.note && <p className="mb-2 text-sm text-gray-600">{task.note}</p>}
                  {task?.completedAt && (
                    <p className="mb-3 text-xs text-gray-500">
                      Completed {formatDate(task.completedAt)}
                    </p>
                  )}
                  {task && task.status !== 'completed' && task.status !== 'skipped' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleCompleteStage(stage)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Mark complete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && orderId && tasks.length === 0 && !error && (
        <p className="text-gray-500">No fulfillment tasks found for this order.</p>
      )}
    </AdminShell>
  );
}

function statusBadgeClass(status: string): string {
  const base = 'rounded-full px-2 py-0.5 text-xs font-medium';
  switch (status) {
    case 'completed':
      return `${base} bg-green-100 text-green-800`;
    case 'in_progress':
      return `${base} bg-blue-100 text-blue-800`;
    case 'skipped':
      return `${base} bg-gray-100 text-gray-800`;
    default:
      return `${base} bg-yellow-100 text-yellow-800`;
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('fr-DZ', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
