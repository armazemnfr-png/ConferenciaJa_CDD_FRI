import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, Timer } from "lucide-react";

const ROOMS = [
  { id: "corona", name: "Sala 1: Corona", fixedStart: "07:30" },
  { id: "stella", name: "Sala 2: Stella", fixedStart: "06:45" },
];

export default function MatinalPlay() {
  const [historico, setHistorico] = useState<any[]>([]);

  // 1. Função para finalizar e calcular o tempo
  const handleFinish = async (room: (typeof ROOMS)[0]) => {
    const agora = new Date();
    const [hora, min] = room.fixedStart.split(":");

    // Criar o horário de início com a data de hoje
    const inicio = new Date();
    inicio.setHours(parseInt(hora), parseInt(min), 0);

    // Diferença em minutos
    const diffMs = agora.getTime() - inicio.getTime();
    const duracaoMinutos = Math.floor(diffMs / 60000);

    const novoRegistro = {
      roomName: room.name,
      fixedStartTime: room.fixedStart,
      actualEndTime: agora.toLocaleTimeString("pt-BR"),
      durationMinutes: duracaoMinutos,
      date: agora.toLocaleDateString("pt-BR"),
    };

    // Enviar para o servidor
    try {
      const response = await fetch("/api/matinals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: room.name,
          fixedStartTime: room.fixedStart,
          durationMinutes: duracaoMinutos,
          actualEndTime: agora.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar no banco de dados");
      }

      // Atualiza a tela na hora
      setHistorico([novoRegistro, ...historico]);
    } catch (err) {
      console.error("Erro ao salvar, mas vou mostrar na tela mesmo assim");
      setHistorico([novoRegistro, ...historico]);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Timer className="text-blue-600" /> MatinalPlay
        </h1>
        <p className="text-gray-500">
          Clique para encerrar a matinal e registrar o tempo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {ROOMS.map((room) => (
          <div
            key={room.id}
            className="bg-white border-2 border-gray-100 p-6 rounded-2xl shadow-sm hover:border-blue-200 transition"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl">{room.name}</h3>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                Início: {room.fixedStart}
              </span>
            </div>

            <button
              onClick={() => handleFinish(room)}
              className="w-full bg-blue-600 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition"
            >
              <CheckCircle size={20} /> FINALIZAR MATINAL
            </button>
          </div>
        ))}
      </div>

      {/* Tabela de Histórico Simples */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 font-bold">
          Histórico de Hoje
        </div>
        <div className="divide-y">
          {historico.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              Nenhuma matinal encerrada ainda.
            </div>
          )}
          {historico.map((h, i) => (
            <div
              key={i}
              className="p-4 flex justify-between items-center text-sm"
            >
              <span className="font-medium">{h.roomName}</span>
              <span className="text-gray-500">
                Terminou às {h.actualEndTime}
              </span>
              <span
                className={`font-bold ${h.durationMinutes > 30 ? "text-red-500" : "text-green-600"}`}
              >
                {h.durationMinutes} min
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
