import Link from "next/link";

export default async function BrandSyncErrorPage({ searchParams }: { searchParams?: Promise<{ code?: string }> }) {
  const resolvedSearchParams = (await searchParams) || {};
  const code = resolvedSearchParams.code || '';

  let title = 'Link unavailable';
  let message = 'This BrandSync link is not available.';

  if (code === 'already_clicked') {
    title = 'Already opened';
    message = 'You have already opened this link. Each BrandSync link can only be opened once from the same IP address.';
  } else if (code === 'not_available') {
    title = 'Link not active';
    message = 'This BrandSync link is not active yet. It will become available after payment is confirmed.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="max-w-md w-full p-8 rounded-lg border bg-gray-50 dark:bg-gray-800">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>

        <div className="flex gap-3">
          <Link href="/" className="inline-flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-md">Home</Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center px-4 py-2 border rounded-md">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
