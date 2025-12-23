import { HealthResponse } from '@gym-erp/shared';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let health: HealthResponse | null = null;
  let error = '';

  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(`${apiUrl}/health`);
    if (res.ok) {
      health = await res.json();
    } else {
      error = `Error: ${res.statusText}`;
    }
  } catch (err) {
    error = `Fetch error: ${err}`;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Gym ERP - Cycle 0</h1>
      <h2>Backend Status</h2>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      )}
    </div>
  );
}
