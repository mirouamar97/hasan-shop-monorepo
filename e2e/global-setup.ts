import { API_URL, ADMIN_URL, STOREFRONT_URL } from './helpers/config';
import { waitForHealth } from './helpers/wait-for-health';

export default async function globalSetup(): Promise<void> {
  if (!process.env.CI) {
    return;
  }

  await waitForHealth([
    {
      url: `${API_URL}/api/v1/health`,
      validate: (body) => body.includes('"database":"up"') && body.includes('"redis":"up"'),
    },
    { url: ADMIN_URL },
    { url: `${STOREFRONT_URL}/ar` },
  ]);
}
