'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ?? 'https://wa.me/213000000000';

export function FloatingWhatsApp() {
  const t = useTranslations('trust');

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-xl)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      aria-label={t('whatsapp')}
    >
      <MessageCircle className="h-7 w-7" aria-hidden />
    </a>
  );
}
