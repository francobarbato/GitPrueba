import { Sidebar } from "../components/sidebar"
import { Header } from "../components/header"
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">

        <Header />

        <main className="flex-1 p-6 flex flex-col items-center justify-center">

          <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 flex flex-col items-center">

            <img 
              src={session.user?.image ?? "/default-avatar.png"} 
              alt="Avatar"
              className="w-28 h-28 rounded-full border shadow mb-4"
            />

            <h2 className="text-2xl font-bold text-gray-800">
              {session.user?.name}
            </h2>

            <p className="text-gray-600 mt-1">
              {session.user?.email}
            </p>

            <div className="w-full mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Datos de sesión
              </h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-48">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
