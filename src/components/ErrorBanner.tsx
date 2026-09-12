export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
      {message}
    </div>
  );
}
