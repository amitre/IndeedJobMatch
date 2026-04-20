export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      <strong>Error:</strong> {message}
    </div>
  );
}
