"use client";
import { useEffect, useState } from "react";

interface DashboardData {
  totalCasos: number;
  casosAbiertos: number;
  casosEnProceso: number;
  casosCerrados: number;
  promedioAvance: number;
  totalClientes: number;
}

export function useDashboardData(refreshInterval = 15000) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener datos del dashboard:", error);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { data, loading };
}
