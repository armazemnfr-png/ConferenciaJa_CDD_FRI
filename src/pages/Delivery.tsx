import React, { useState } from 'react';
import { ArrowLeft, LayoutGrid, Package, ChevronRight } from 'lucide-react';

export default function DeliveryView() {
  // Simulando que o mapa 227979 foi carregado (conforme sua imagem)
  const mapaNumero = "227979"; 

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabeçalho Azul - Identidade Visual */}
      <div className="bg-[#0056b3] text-white p-6 shadow-md">
        <div className="flex items-center gap-4 mb-2">
          <ArrowLeft size={24} />
          <h1 className="text-xl font-bold">Visão Geral</h1>
        </div>
        <p className="text-blue-100 text-sm">Mapa: {mapaNumero}</p>
      </div>

      {/* Barra de Progresso - Mais compacta */}
      <div className="p-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 font-bold text-sm">Progresso Total</span>
            <span className="text-blue-600 font-black text-xl">0%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-[0%]" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">0 DE 88 ITENS FINALIZADOS</p>
        </div>
      </div>

      {/* ÁREA DAS BAIAS - O coração do visual */}
      <div className="px-4 pb-24">
        <div className="grid grid-cols-2 gap-4">

          {/* COLUNA ESQUERDA: AJUDANTE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-yellow-400 rounded-full" />
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Lado Ajudante</h2>
            </div>

            {/* Exemplo de Card de Baia */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-blue-600 active:bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Baia</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-slate-700">A01</span>
                <ChevronRight size={18} className="text-slate-300 pb-1" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-blue-600 opacity-50">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Baia</span>
              <div className="text-2xl font-black text-slate-700">A02</div>
            </div>
          </div>

          {/* COLUNA DIREITA: MOTORISTA */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-blue-900 rounded-full" />
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Lado Motorista</h2>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-blue-900">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Baia</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-slate-700">M01</span>
                <ChevronRight size={18} className="text-slate-300 pb-1" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BOTÃO FIXO NO RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 to-transparent">
        <button className="w-full bg-blue-700 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200">
          <Package size={20} />
          ENCERRAR CONFERÊNCIA
        </button>
      </div>
    </div>
  );
}