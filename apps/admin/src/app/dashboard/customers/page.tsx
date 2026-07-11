'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import {
  addCustomerNote,
  addCustomerTag,
  fetchCustomerProfile,
  type CustomerProfile,
} from '@/lib/api';

export default function CustomersPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function searchCustomer(event?: React.FormEvent) {
    event?.preventDefault();
    const phone = phoneInput.trim();
    if (!phone) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchCustomerProfile(phone);
      setProfile(data);
    } catch (loadError) {
      setProfile(null);
      setError(loadError instanceof Error ? loadError.message : 'Customer not found');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote(event: React.FormEvent) {
    event.preventDefault();
    const note = noteInput.trim();
    if (!profile || !note) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      await addCustomerNote({ phone: profile.phone, note });
      const refreshed = await fetchCustomerProfile(profile.phone);
      setProfile(refreshed);
      setNoteInput('');
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : 'Failed to add note');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddTag(event: React.FormEvent) {
    event.preventDefault();
    const tag = tagInput.trim();
    if (!profile || !tag) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      await addCustomerTag({ phone: profile.phone, tag });
      const refreshed = await fetchCustomerProfile(profile.phone);
      setProfile(refreshed);
      setTagInput('');
    } catch (tagError) {
      setError(tagError instanceof Error ? tagError.message : 'Failed to add tag');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Customers">
      <form onSubmit={searchCustomer} className="mb-6 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Phone number</span>
          <input
            value={phoneInput}
            onChange={(event) => setPhoneInput(event.target.value)}
            placeholder="0555 12 34 56"
            className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !phoneInput.trim()}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {profile && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h3 className="mb-4 text-lg font-semibold">Profile</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium">{profile.phone}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium">
                  {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Orders</dt>
                <dd className="font-medium">{profile.orderCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total spent</dt>
                <dd className="font-medium">{profile.totalSpent.toLocaleString('fr-DZ')} DA</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {profile.tags.length === 0 ? (
                    <span className="text-gray-400">None</span>
                  ) : (
                    profile.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>

            <form onSubmit={handleAddTag} className="mt-6 space-y-2">
              <label className="block text-xs font-medium text-gray-600">Add tag</label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="vip, wholesale..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy || !tagInput.trim()}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Timeline</h3>
              {profile.timeline.length === 0 ? (
                <p className="text-sm text-gray-500">No activity yet</p>
              ) : (
                <ul className="space-y-4">
                  {profile.timeline.map((entry) => (
                    <li key={entry.id} className="border-l-2 border-gray-200 pl-4">
                      <p className="text-sm font-medium">{entry.title}</p>
                      {entry.description && (
                        <p className="text-sm text-gray-600">{entry.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">{formatDate(entry.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Notes</h3>
              {profile.notes.length === 0 ? (
                <p className="mb-4 text-sm text-gray-500">No notes yet</p>
              ) : (
                <ul className="mb-4 space-y-3">
                  {profile.notes.map((note) => (
                    <li key={note.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                      <p>{note.note}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {note.authorName ?? 'Staff'} · {formatDate(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={noteInput}
                  onChange={(event) => setNoteInput(event.target.value)}
                  placeholder="Add an internal note..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy || !noteInput.trim()}
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Save note
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('fr-DZ', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
