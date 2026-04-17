import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle, Package, Truck, Users, Loader2, ArrowLeft, ClipboardCheck } from 'lucide-react';
import { Link } from 'wouter';

type UploadType = 'WMS' | 'PW' | 'MOT' | 'GINFO';

const UploadDados = () => {
  const [activeTab, setActiveTab] = useState<UploadType>('WMS');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const configs = {
    WMS: { title: "Relatório WMS (Itens)", icon: <Package className="w-5 h-5" />, endpoint: '/api/wms-items/upload' },
    PW: { title: "Relatório PW 031120 (Promax)", icon: <Truck className="w-5 h-5" />, endpoint: '/api/promax/upload' },
    MOT: { title: "Base Matrícula (Motoristas)", icon: <Users className="w-5 h-5" />, endpoint: '/api/motoristas/upload' },
    GINFO: { title: "Checklist Ginfo (Saída de Veículos)", icon: <ClipboardCheck className="w-5 h-5" />, endpoint: '/api/ginfo/upload' }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: async (results) => {
        try {
          let items: any[] = [];

          if (activeTab === 'WMS') {
            // Mapeamento e limpeza de dados do WMS
            items = results.data.map((item: any) => ({
              warehouseCode: String(item['Código do Armazém'] || ""),
              mapNumber: String(item['Mapas'] || "").trim(),
              bayNumber: String(item['Palete'] || ""),
              box: String(item['Caixa'] || ""),
              sequence: String(item['Sequência'] || ""),
              status: String(item['Status'] || ""),
              sku: String(item['Código do item'] || ""),
              description: String(item['Item'] || ""),
              expectedQuantity: Number(item['Qtd']) || 0,
              subtype: String(item['Subtipo'] || ""),
              category: String(item['Categoria'] || ""),
              unitOfMeasure: String(item['Unidade'] || ""),
              origin: String(item['Origem'] || ""),
              deliveryDate: String(item['Data de entrega'] || ""),
              plate: String(item['Placa'] || ""),
              isChecked: false,
              checkedQuantity: 0,
              hasDamage: false
            })).filter((item: any) => item.mapNumber && item.description && item.mapNumber !== "undefined");
          } 
          else if (activeTab === 'PW') {
            items = results.data.map((item: any) => ({
              mapa: String(item['Mapa'] || "").trim(),
              fase: String(item['Fase'] || "").trim(),
              hrOper: String(item['HrOper'] || item['Hr Oper'] || item['Hr_Oper'] || "").trim(),
              dtOper: String(item['DtOper'] || item['Dt Oper'] || item['Dt_Oper'] || item['Data'] || "").trim(),
              motorista: String(item['Motorista'] || "").trim(),
              veiculo: String(item['Veiculo'] || item['Veículo'] || "").trim(),
              placa: String(item['Placa'] || "").trim(),
            })).filter((item: any) => item.mapa && item.fase);
          } 
          else if (activeTab === 'MOT') {
            items = results.data.map((item: any) => ({
              registration: String(item['Matrícula'] || "").trim(),
              name: String(item['Colaborador'] || "").trim(),
              room: String(item['Sala'] || "")
            })).filter((item: any) => item.registration && item.registration !== "");
          }
          else if (activeTab === 'GINFO') {
            // Colunas: G=REALIZADO POR, H=EQUIPE, N=MAPA, T=TEMPO
            // Parseia por nome de cabeçalho, com fallback por índice (header: false)
            items = results.data.map((row: any) => {
              const realizadoPor = String(
                row['REALIZADO POR'] || row['Realizado Por'] || row['realizado_por'] || ""
              ).trim();
              const equipe = String(
                row['EQUIPE'] || row['Equipe'] || row['equipe'] || ""
              ).trim();
              const mapa = String(
                row['MAPA'] || row['Mapa'] || row['mapa'] || ""
              ).trim();
              const tempo = String(
                row['TEMPO'] || row['Tempo'] || row['tempo'] || ""
              ).trim();
              return { realizadoPor, equipe, mapa, tempo };
            }).filter((item: any) => item.mapa && item.mapa !== "undefined" && item.tempo);
          }

          if (items.length === 0) {
            throw new Error(`Nenhum dado válido encontrado. Certifique-se de que o arquivo é um CSV e os cabeçalhos estão corretos.`);
          }

          console.log(`Enviando ${items.length} itens para ${configs[activeTab].endpoint}`);

          const response = await fetch(configs[activeTab].endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Erro no servidor");

          setStatus({ 
            type: 'success', 
            msg: `Sucesso! ${items.length} registros processados. A base anterior de ${activeTab} foi limpa.` 
          });

        } catch (err: any) {
          console.error(err);
          setStatus({ type: 'error', msg: err.message || 'Erro ao processar arquivo.' });
        } finally {
          setLoading(false);
          if (e.target) e.target.value = ''; 
        }
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin"
          data-testid="link-upload-back"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao Painel
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Painel de Importação</h1>

      <div className="flex border-b border-gray-200 mb-8">
        {(Object.keys(configs) as UploadType[]).map((tab) => (
          <button
            key={tab}
            disabled={loading}
            onClick={() => { setActiveTab(tab); setStatus(null); }}
            className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 font-medium transition-all
              ${activeTab === tab 
                ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            {configs[tab].icon}
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {configs[activeTab].icon} {configs[activeTab].title}
          </h2>
          <p className="text-gray-500 mt-1">
            {loading ? "Aguarde, limpando base de dados e importando..." : "Selecione o arquivo CSV para atualizar a base."}
          </p>
        </div>

        <div className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors ${loading ? 'bg-gray-50 border-gray-300' : 'hover:border-blue-400 border-gray-200'}`}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload-main"
            disabled={loading}
          />
          <label htmlFor="csv-upload-main" className={`flex flex-col items-center ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${loading ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
              {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
            </div>
            <span className="text-xl font-semibold text-gray-700">
              {loading ? 'Limpando e Importando...' : `Carregar CSV para ${activeTab}`}
            </span>
            {!loading && <p className="text-sm text-gray-400 mt-2">Certifique-se de que o arquivo é .CSV</p>}
          </label>
        </div>

        {status && (
          <div className={`mt-8 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{status.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDados;