export default function Loading() {
  return (
    <div className="flex h-[70vh] w-full items-center justify-center">
      <p className="flex flex-col items-center gap-4">
        {/* Círculo giratorio usando solo Tailwind */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Cargando información...
        </p>
      </p>
    </div>
  );
}