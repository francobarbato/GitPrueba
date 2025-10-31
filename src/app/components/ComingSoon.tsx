export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-3xl font-bold mb-3">{title}</h1>
      <p className="text-gray-500">Sección en desarrollo. Próximamente disponible.</p>
    </div>
  );
}
