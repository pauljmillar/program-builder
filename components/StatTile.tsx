export default function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-mist-gray bg-white p-6">
      <div className="font-display text-4xl text-deep-blue">{value}</div>
      <div className="mt-2 text-sm text-blue-gray">{label}</div>
    </div>
  );
}
