import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle, AlertCircle, Package, Truck, Users, Loader2, ArrowLeft, ClipboardCheck, FileText, Clock, BarChart2, Download } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type UploadType = 'WMS' | 'PW' | 'MOT' | 'GINFO' | 'KPI';

interface UploadMeta {
  id: number;
  type: string;
  fileName: string;
  recordCount: number;
  importedAt: string;
}

const configs: Record<UploadType, { title: string; icon: React.ReactNode; endpoint: string; downloadEndpoint: string; downloadName: string }> = {
  WMS:   { title: "Relatório WMS (Itens)",               icon: <Package className="w-5 h-5" />,       endpoint: '/api/wms-items/upload',  downloadEndpoint: '/api/download/wms',  downloadName: 'wms_export.csv' },
  PW:    { title: "Relatório PW 031120 (Promax)",         icon: <Truck className="w-5 h-5" />,          endpoint: '/api/promax/upload',      downloadEndpoint: '/api/download/pw',   downloadName: 'promax_export.csv' },
  MOT:   { title: "Base Matrícula (Motoristas)",          icon: <Users className="w-5 h-5" />,          endpoint: '/api/motoristas/upload',  downloadEndpoint: '/api/download/mot',  downloadName: 'motoristas_export.csv' },
  GINFO: { title: "Checklist Ginfo (Saída de Veículos)",  icon: <ClipboardCheck className="w-5 h-5" />, endpoint: '/api/ginfo/upload',       downloadEndpoint: '/api/download/ginfo',downloadName: 'ginfo_export.csv' },
  KPI:   { title: "Resultados KPIs de Entrega",           icon: <BarChart2 className="w-5 h-5" />,      endpoint: '/api/kpi/upload',         downloadEndpoint: '/api/download/kpi',  downloadName: 'kpi_export.csv' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const UploadDados = () => {
  const [activeTab, setActiveTab] = useState<UploadType>('WMS');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const queryClient = useQueryClient();

  const handleDownload = async (type: UploadType) => {
    setDownloading(true);
    try {
      const res = await fetch(configs[type].downloadEndpoint);
      if (!res.ok) throw new Error('Erro ao baixar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = configs[type].downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setStatus({ type: 'error', msg: 'Erro ao baixar o relatório.' });
    } finally {
      setDownloading(false);
    }
  };

  const { data: metaList = [] } = useQuery<UploadMeta[]>({
    queryKey: ['/api/upload-meta'],
  });

  const metaByType = metaList.reduce<Record<string, UploadMeta>>((acc, m) => {
    acc[m.type] = m;
    return acc;
  }, {});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    const headerCounts: Record<string, number> = {};
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => {
        const key = h.trim();
        headerCounts[key] = (headerCounts[key] || 0) + 1;
        return headerCounts[key] > 1 ? `${key}_${headerCounts[key]}` : key;
      },
      complete: async (results) => {
        try {
          let items: any[] = [];

          if (activeTab === 'WMS') {
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
              tipoMapa: String(item['TipoMapa'] || item['Tipo Mapa'] || item['Tipo_Mapa'] || item['tipo_mapa'] || "").trim(),
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
            // Extrai só a hora de "DD/MM/YYYY HH:MM" ou "DD/MM/YYYY HH:MM:SS"
            const extractTime = (v: string): string => {
              const m = v.match(/(\d{1,2}:\d{2}(?::\d{2})?)$/);
              return m ? m[1] : v;
            };
            items = results.data.map((row: any) => {
              const realizadoPor = String(row['REALIZADO POR'] || row['Realizado Por'] || row['realizado_por'] || "").trim();
              // Arquivo tem coluna EQUIPE duplicada (equipe motorista, equipe 2º motorista)
              // PapaParse renomeia duplicatas como EQUIPE_2, EQUIPE_3 — pega o primeiro não-vazio
              const equipe = String(
                row['EQUIPE'] || row['EQUIPE_2'] || row['EQUIPE_3'] ||
                row['Equipe'] || row['equipe'] || ""
              ).trim();
              const mapa = String(row['MAPA'] || row['Mapa'] || row['mapa'] || "").trim();
              const tempo = String(row['TEMPO'] || row['Tempo'] || row['tempo'] || "").trim();
              const hrInicioRaw = String(row['HR INICIO'] || row['Hr Inicio'] || row['HR_INICIO'] || row['HrInicio'] || row['HRINICIO'] || "").trim();
              const hrFinalRaw = String(row['HR FINAL'] || row['Hr Final'] || row['HR_FINAL'] || row['HrFinal'] || row['HRFINAL'] || "").trim();
              const hrInicio = extractTime(hrInicioRaw);
              const hrFinal = extractTime(hrFinalRaw);
              // Campos extras para cruzamento server-side quando MAPA vier vazio
              const matricula = String(row['MATRICULA'] || row['Matricula'] || row['matricula'] || "").trim();
              const data = String(row['DATA'] || row['Data'] || row['data'] || "").trim();
              return { realizadoPor, equipe, mapa, tempo, hrInicio, hrFinal, matricula, data };
            }).filter((item: any) => (item.mapa || item.matricula) && item.tempo);
          }
          else if (activeTab === 'KPI') {
            items = results.data.map((row: any) => {
              const cpf = String(row['CPF'] || row['cpf'] || "").replace(/\D/g, "").trim();
              const mensagem = String(row['Mensagem'] || row['MENSAGEM'] || row['mensagem'] || "").trim();
              const nome = String(row['Nome'] || row['NOME'] || row['nome'] || "").trim();
              return { cpf, mensagem, nome };
            }).filter((item: any) => item.cpf && item.cpf.length >= 8 && item.mensagem);
          }

          if (items.length === 0) {
            throw new Error(`Nenhum dado válido encontrado. Certifique-se de que o arquivo é um CSV e os cabeçalhos estão corretos.`);
          }

          const response = await fetch(configs[activeTab].endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, fileName: file.name }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Erro no servidor");

          queryClient.invalidateQueries({ queryKey: ['/api/upload-meta'] });
          setStatus({
            type: 'success',
            msg: `Sucesso! ${items.length} registros importados. A base anterior de ${activeTab} foi limpa.`
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

      {/* Cards de status por relatório */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {(Object.keys(configs) as UploadType[]).map((tab) => {
          const meta = metaByType[tab];
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setStatus(null); }}
              className={`rounded-xl border p-4 text-left transition-all ${
                activeTab === tab
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className={`flex items-center gap-2 font-semibold text-sm mb-2 ${activeTab === tab ? 'text-blue-700' : 'text-gray-700'}`}>
                {configs[tab].icon}
                {tab}
              </div>
              {meta ? (
                <>
                  <div className="flex items-start gap-1 text-xs text-gray-600 mb-1">
                    <FileText className="w-3 h-3 mt-0.5 shrink-0 text-green-600" />
                    <span className="break-all leading-tight font-medium text-gray-800">{meta.fileName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{formatDate(meta.importedAt)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{meta.recordCount.toLocaleString('pt-BR')} registros</div>
                </>
              ) : (
                <div className="text-xs text-gray-400 italic">Nenhum arquivo importado</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {configs[activeTab].icon} {configs[activeTab].title}
            </h2>
            <p className="text-gray-500 mt-1">
              {loading ? "Aguarde, limpando base de dados e importando..." : "Selecione o arquivo CSV para atualizar a base."}
            </p>
          </div>
          {metaByType[activeTab] && (
            <button
              data-testid="button-download-report"
              onClick={() => handleDownload(activeTab)}
              disabled={downloading}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border border-green-600 text-green-700 bg-green-50 hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? 'Baixando...' : 'Baixar CSV'}
            </button>
          )}
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
