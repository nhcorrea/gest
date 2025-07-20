"use client";
import {
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useMemo,
} from "react";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "./recharts";

const stakeTypes = [
  {
    label: "Mapa por mapa",
    options: [
      { label: "Agressivo", value: 0.1 },
      { label: "Meio Agressivo", value: 0.05 },
      { label: "Normal", value: 0.02 },
      { label: "Recomendado", value: 0.05 }, // recomendado 5%
    ],
  },
  {
    label: "MD3/MD5",
    options: [
      { label: "Agressivo", value: 0.1 },
      { label: "Meio Agressivo", value: 0.05 },
      { label: "Normal", value: 0.02 },
      { label: "Recomendado", value: 0.1 }, // recomendado 10%
    ],
  },
  {
    label: "Handicap",
    options: [
      { label: "Agressivo", value: 0.1 },
      { label: "Meio Agressivo", value: 0.05 },
      { label: "Normal", value: 0.02 },
      { label: "Recomendado", value: 0.02 }, // recomendado 2%
    ],
  },
];

const betTypeOptions = [
  { label: "Mapa por mapa", value: "Mapa por mapa" },
  { label: "MD3/MD5", value: "MD3/MD5" },
  { label: "Handicap", value: "Handicap" },
  { label: "Outro", value: "Outro" },
];

type Bet = {
  id: string;
  type: string;
  teamA: string;
  teamB: string;
  selectedTeam: string;
  value: string;
  odds: string; // odds no padrão "1.80"
  handicap: string;
  result?: "win" | "red";
  date: string; // ISO string
  game: string; // CS2, Valorant, LOL, Outro
  event: string;
  customGameName?: string;
  tier: string;
  returnValue?: number; // Adiciona returnValue ao tipo Bet
};

const BETS_STORAGE_KEY = "gestao_bets";

const gameOptions = [
  { label: "CS2", value: "CS2" },
  { label: "Valorant", value: "Valorant" },
  { label: "LOL", value: "LOL" },
  { label: "Outro", value: "Outro" },
];

const tierOptions = [
  { label: "S", value: "S" },
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "C", value: "C" },
  { label: "Outro", value: "Outro" },
];

export default function Home() {
  const [banca, setBanca] = useState(0);
  const [stakeType, setStakeType] = useState(stakeTypes[0]);
  const [selectedStake, setSelectedStake] = useState(
    stakeTypes[0].options[0].value
  );
  const [bets, setBets] = useState<Bet[]>([]);
  const [betForm, setBetForm] = useState<Bet>({
    id: "",
    type: betTypeOptions[0].value,
    teamA: "",
    teamB: "",
    selectedTeam: "A",
    value: "",
    odds: "",
    handicap: "0",
    date: "",
    game: gameOptions[0].value,
    event: "",
    customGameName: "",
    tier: tierOptions[0].value,
    returnValue: 0,
  });
  const [filters, setFilters] = useState({
    game: "",
    type: "",
    tier: "",
    event: "",
    result: "",
    dateFrom: "",
    dateTo: "",
  });
  const [chartDateFrom, setChartDateFrom] = useState("");
  const [chartDateTo, setChartDateTo] = useState("");
  const stakeValue = banca * selectedStake;
  const showAlert = banca > 2000;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [betsPage, setBetsPage] = useState(0);
  const betsPerPage = 5;

  // Carrega bets do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(BETS_STORAGE_KEY);
    if (saved) {
      try {
        setBets(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Salva bets no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(BETS_STORAGE_KEY, JSON.stringify(bets));
  }, [bets]);

  // Atualiza o formulário ao trocar o tipo de stake
  function handleStakeTypeChange(type: (typeof stakeTypes)[number]) {
    setStakeType(type);
    setSelectedStake(type.options[0].value);
  }

  function handleBetFormChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setBetForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddBet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Calcula retorno bruto da aposta
    let returnValue = 0;
    const oddsNum = Number(betForm.odds);
    const valueNum = Number(betForm.value);
    if (betForm.result === "win") {
      returnValue = oddsNum && valueNum ? valueNum * oddsNum : 0;
    } else if (betForm.result === "red") {
      returnValue = 0;
    }
    setBets((prev) => [
      ...prev,
      {
        ...betForm,
        id: uuidv4(),
        date: new Date().toISOString(),
        game:
          betForm.game === "Outro" && betForm.customGameName
            ? betForm.customGameName
            : betForm.game,
        returnValue,
      },
    ]);
    setBetForm({
      type: betTypeOptions[0].value,
      teamA: "",
      teamB: "",
      selectedTeam: "A",
      value: "",
      odds: "",
      handicap: "0",
      id: "",
      date: "",
      game: gameOptions[0].value,
      event: "",
      customGameName: "",
      tier: tierOptions[0].value,
      returnValue: 0,
    });
  }

  const isHandicap = betForm.type === "Handicap";

  // Função para marcar resultado da bet
  function handleBetResult(idx: number, result: "win" | "red") {
    setBets((prev) =>
      prev.map((bet, i) => {
        if (i !== idx) return bet;
        const oddsNum = Number(bet.odds);
        const valueNum = Number(bet.value);
        let returnValue = 0;
        if (result === "win") {
          returnValue = oddsNum && valueNum ? valueNum * oddsNum : 0;
        } else if (result === "red") {
          returnValue = 0;
        }
        return { ...bet, result, returnValue };
      })
    );
  }

  // Função para exportar bets para JSON
  function handleExportBets() {
    const today = new Date();
    const dateStr = today.toLocaleDateString("pt-BR").replace(/\//g, "-"); // dd-mm-yyyy
    const dataStr = JSON.stringify(bets, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-bets-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleResetBets() {
    if (
      window.confirm("Tem certeza que deseja limpar todo o histórico de bets?")
    ) {
      setBets([]);
    }
  }

  // Função para importar bets de um JSON
  function handleImportBets(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setBets(
            imported.map((bet: Partial<Bet>) => ({
              id: bet.id || uuidv4(),
              type: bet.type || "",
              teamA: bet.teamA || "",
              teamB: bet.teamB || "",
              selectedTeam: bet.selectedTeam || "A",
              value: bet.value || "",
              odds: bet.odds || "",
              handicap: bet.handicap || "0",
              result: bet.result,
              date: bet.date || new Date().toISOString(),
              game: bet.game || gameOptions[0].value,
              event: bet.event || "",
              customGameName: bet.customGameName || "",
              tier: bet.tier || tierOptions[0].value,
              returnValue: bet.returnValue ?? 0,
            }))
          );
          alert("Apostas importadas com sucesso!");
        } else {
          alert("Arquivo inválido. O JSON deve ser uma lista de apostas.");
        }
      } catch {
        alert("Erro ao importar o arquivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      if (filters.game && bet.game !== filters.game) return false;
      if (filters.type && bet.type !== filters.type) return false;
      if (filters.tier && bet.tier !== filters.tier) return false;
      if (
        filters.event &&
        !bet.event.toLowerCase().includes(filters.event.toLowerCase())
      )
        return false;
      if (filters.result && bet.result !== filters.result) return false;
      if (filters.dateFrom && new Date(bet.date) < new Date(filters.dateFrom))
        return false;
      if (filters.dateTo && new Date(bet.date) > new Date(filters.dateTo))
        return false;
      return true;
    });
  }, [bets, filters]);

  // Filtros de datas para os gráficos
  const betsForCharts = useMemo(() => {
    return bets.filter((bet) => {
      if (chartDateFrom && new Date(bet.date) < new Date(chartDateFrom))
        return false;
      if (chartDateTo && new Date(bet.date) > new Date(chartDateTo))
        return false;
      return true;
    });
  }, [bets, chartDateFrom, chartDateTo]);

  // ROI, Winrate, Lucro, Stake média para o período selecionado
  const totalInvested = betsForCharts.reduce(
    (acc, b) => acc + Number(b.value),
    0
  );
  const totalReturn = betsForCharts.reduce(
    (acc, b) => acc + (b.returnValue || 0),
    0
  );
  const lucroTotal = totalReturn - totalInvested;
  const roi = totalInvested
    ? ((lucroTotal / totalInvested) * 100).toFixed(2)
    : "0.00";
  const winCount = betsForCharts.filter((b) => b.result === "win").length;
  const winRate = betsForCharts.length
    ? ((winCount / betsForCharts.length) * 100).toFixed(2)
    : "0.00";
  const avgStake = betsForCharts.length
    ? (totalInvested / betsForCharts.length).toFixed(2)
    : "0.00";

  // Lucro acumulado por data
  const bankrollData: { date: string; saldo: number }[] = [];
  let acc = 0;
  [...betsForCharts]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((b) => {
      acc += (b.returnValue || 0) - Number(b.value);
      bankrollData.push({
        date: new Date(b.date).toLocaleDateString("pt-BR"),
        saldo: acc,
      });
    });

  // Lucro por jogo
  const lucroPorJogo: Record<string, number> = {};
  betsForCharts.forEach((b) => {
    if (!lucroPorJogo[b.game]) lucroPorJogo[b.game] = 0;
    lucroPorJogo[b.game] += (b.returnValue || 0) - Number(b.value);
  });
  const lucroPorJogoArr = Object.entries(lucroPorJogo).map(([game, lucro]) => ({
    game,
    lucro,
  }));

  // Lucro por tier
  const lucroPorTier: Record<string, number> = {};
  betsForCharts.forEach((b) => {
    if (!lucroPorTier[b.tier]) lucroPorTier[b.tier] = 0;
    lucroPorTier[b.tier] += (b.returnValue || 0) - Number(b.value);
  });
  const lucroPorTierArr = Object.entries(lucroPorTier).map(([tier, lucro]) => ({
    tier,
    lucro,
  }));

  // Lucro por evento
  const lucroPorEvento: Record<string, number> = {};
  betsForCharts.forEach((b) => {
    if (!lucroPorEvento[b.event]) lucroPorEvento[b.event] = 0;
    lucroPorEvento[b.event] += (b.returnValue || 0) - Number(b.value);
  });
  const lucroPorEventoArr = Object.entries(lucroPorEvento).map(
    ([event, lucro]) => ({ event, lucro })
  );

  // Lucro por tipo de aposta
  const lucroPorTipo: Record<string, number> = {};
  betsForCharts.forEach((b) => {
    if (!lucroPorTipo[b.type]) lucroPorTipo[b.type] = 0;
    lucroPorTipo[b.type] += (b.returnValue || 0) - Number(b.value);
  });
  const lucroPorTipoArr = Object.entries(lucroPorTipo).map(([type, lucro]) => ({
    type,
    lucro,
  }));

  // Lucro por time real apostado
  const lucroPorTimeReal: Record<string, number> = {};
  betsForCharts.forEach((b) => {
    const nomeTime = b.selectedTeam === "A" ? b.teamA : b.teamB;
    if (!nomeTime) return;
    if (!lucroPorTimeReal[nomeTime]) lucroPorTimeReal[nomeTime] = 0;
    lucroPorTimeReal[nomeTime] += (b.returnValue || 0) - Number(b.value);
  });
  const lucroPorTimeRealArr = Object.entries(lucroPorTimeReal).map(
    ([team, lucro]) => ({ team, lucro })
  );

  // Lucro por resultado (win/red)
  const lucroPorResultado: Record<string, number> = { win: 0, red: 0 };
  betsForCharts.forEach((b) => {
    if (b.result === "win")
      lucroPorResultado.win += (b.returnValue || 0) - Number(b.value);
    if (b.result === "red")
      lucroPorResultado.red += (b.returnValue || 0) - Number(b.value);
  });
  const lucroPorResultadoArr = [
    { resultado: "Win", lucro: lucroPorResultado.win },
    { resultado: "Red", lucro: lucroPorResultado.red },
  ];

  // Distribuição de odds (faixas)
  const oddsBuckets = [
    { label: "<1.5", min: 0, max: 1.5 },
    { label: "1.5-1.8", min: 1.5, max: 1.8 },
    { label: "1.8-2.2", min: 1.8, max: 2.2 },
    { label: "2.2-3.0", min: 2.2, max: 3.0 },
    { label: ">3.0", min: 3.0, max: Infinity },
  ];
  const oddsDist: Record<string, number> = {};
  oddsBuckets.forEach((b) => (oddsDist[b.label] = 0));
  betsForCharts.forEach((b) => {
    const odds = Number(b.odds);
    const bucket = oddsBuckets.find((r) => odds >= r.min && odds < r.max);
    if (bucket) oddsDist[bucket.label] += 1;
  });
  const oddsDistArr = oddsBuckets.map((b) => ({
    faixa: b.label,
    apostas: oddsDist[b.label],
  }));

  // Pie chart de proporção de tipos de aposta
  const totalBets = betsForCharts.length;
  const tipoDistArr = betTypeOptions
    .map((opt) => {
      const count = betsForCharts.filter((b) => b.type === opt.value).length;
      return { tipo: opt.label, valor: count };
    })
    .filter((d) => d.valor > 0);

  // Limitar eventos/times a 10 principais
  function topN<T extends { lucro: number }>(
    arr: T[],
    key: keyof T,
    n = 10
  ): T[] {
    if (arr.length <= n) return arr;
    const sorted = [...arr].sort(
      (a, b) => Math.abs(b.lucro) - Math.abs(a.lucro)
    );
    const top = sorted.slice(0, n);
    const outros = sorted.slice(n);
    const outrosLucro = outros.reduce((acc, cur) => acc + cur.lucro, 0);
    const outrosObj = { ...top[0], [key]: "Outros", lucro: outrosLucro };
    return [...top, outrosObj];
  }
  const lucroPorEventoArrTop = topN(lucroPorEventoArr, "event");
  const lucroPorTimeRealArrTop = topN(lucroPorTimeRealArr, "team");

  // Últimas X apostas (continua usando filtro geral)
  const ultimasApostas = [...filteredBets]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const paginatedBets = bets.slice(
    betsPage * betsPerPage,
    betsPage * betsPerPage + betsPerPage
  );
  const totalPages = Math.ceil(bets.length / betsPerPage);

  return (
    <div className="font-sans flex flex-col min-h-screen p-8 pb-20 sm:p-20 gap-8">
      <div className="flex flex-col lg:flex-row justify-between gap-8 sm:gap-16 w-full">
        <main className="flex flex-col gap-[32px] items-center sm:items-start w-full max-w-md lg:max-w-sm flex-shrink-0">
          <h1 className="text-2xl font-bold mb-4">Gestão de Stakes</h1>
          <label className="w-full flex flex-col gap-2">
            <span className="font-medium">Banca</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="border rounded px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
              value={banca === 0 ? "" : banca}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setBanca(val ? Number(val) : 0);
              }}
              placeholder="Digite o valor da banca"
              autoComplete="off"
            />
          </label>
          <div className="w-full flex flex-col gap-2">
            <span className="font-medium">Tipo de Stake</span>
            <div className="flex gap-2 mb-2">
              {stakeTypes.map((type) => (
                <button
                  key={type.label}
                  className={`px-3 py-1 rounded border font-semibold transition-colors text-xs sm:text-sm ${
                    stakeType.label === type.label
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                  }`}
                  onClick={() => handleStakeTypeChange(type)}
                  type="button"
                >
                  {type.label}
                </button>
              ))}
            </div>
            <span className="font-medium">Stake</span>
            <div className="flex gap-2">
              {stakeType.options.map((option) => (
                <button
                  key={option.label}
                  className={`px-4 py-2 rounded border font-semibold transition-colors ${
                    selectedStake === option.value
                      ? option.label === "Recomendado"
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white"
                      : option.label === "Recomendado"
                      ? "bg-white text-green-600 border-green-600 hover:bg-green-50"
                      : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                  }`}
                  onClick={() => setSelectedStake(option.value)}
                  type="button"
                >
                  {option.label} ({option.value * 100}%)
                </button>
              ))}
            </div>
          </div>
          <div className="w-full mt-4 p-4 rounded bg-gray-100 dark:bg-gray-800 flex flex-col gap-2">
            <span className="font-medium">Valor da Stake:</span>
            <span className="text-xl font-bold">
              R${" "}
              {stakeValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {showAlert && (
            <div className="w-full flex items-center gap-2 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded shadow text-yellow-900 mt-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-yellow-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Para bancas acima de R$ 2.000, foque em stakes menores que 5%
                para melhor gestão de risco.
              </span>
            </div>
          )}
        </main>
        <aside className="flex flex-col gap-6 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex-shrink">
          <h2 className="text-xl font-bold mb-2">Lista de Bets</h2>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition-colors"
              onClick={handleExportBets}
            >
              Exportar JSON
            </button>
            <button
              type="button"
              className="bg-gray-600 text-white rounded px-4 py-2 font-semibold hover:bg-gray-700 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              Importar JSON
            </button>
            <button
              type="button"
              className="bg-red-600 text-white rounded px-4 py-2 font-semibold hover:bg-red-700 transition-colors"
              onClick={handleResetBets}
            >
              Resetar Histórico
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportBets}
            />
          </div>
          <form className="flex flex-col gap-3" onSubmit={handleAddBet}>
            <div className="flex gap-2 items-center">
              <span className="font-medium">Jogo:</span>
              <select
                name="game"
                value={betForm.game}
                onChange={handleBetFormChange}
                className="border rounded px-2 py-1"
              >
                {gameOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              {betForm.game === "Outro" && (
                <input
                  type="text"
                  name="customGameName"
                  value={betForm.customGameName}
                  onChange={handleBetFormChange}
                  placeholder="Nome do jogo"
                  className="border rounded px-2 py-1 w-32"
                  required
                />
              )}
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-medium">Evento:</span>
              <input
                type="text"
                name="event"
                value={betForm.event}
                onChange={handleBetFormChange}
                placeholder="Nome do evento"
                className="border rounded px-2 py-1 w-full"
                required
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-medium">Tier:</span>
              <select
                name="tier"
                value={betForm.tier}
                onChange={handleBetFormChange}
                className="border rounded px-2 py-1"
              >
                {tierOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
              <input
                type="text"
                name="teamA"
                value={betForm.teamA}
                onChange={handleBetFormChange}
                placeholder="Time A"
                className="border rounded px-2 py-1 w-full"
                required
              />
              <span className="self-center font-bold">vs</span>
              <input
                type="text"
                name="teamB"
                value={betForm.teamB}
                onChange={handleBetFormChange}
                placeholder="Time B"
                className="border rounded px-2 py-1 w-full"
                required
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-medium">Aposta em:</span>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="selectedTeam"
                  value="A"
                  checked={betForm.selectedTeam === "A"}
                  onChange={handleBetFormChange}
                />
                {betForm.teamA || "Time A"}
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="selectedTeam"
                  value="B"
                  checked={betForm.selectedTeam === "B"}
                  onChange={handleBetFormChange}
                />
                {betForm.teamB || "Time B"}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-medium">Tipo de Bet:</span>
              <select
                name="type"
                value={betForm.type}
                onChange={handleBetFormChange}
                className="border rounded px-2 py-1"
                required
              >
                {betTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {isHandicap && (
              <div className="flex gap-2 items-center">
                <span className="font-medium">Handicap:</span>
                <select
                  name="handicap"
                  value={betForm.handicap}
                  onChange={handleBetFormChange}
                  className="border rounded px-2 py-1"
                >
                  {Array.from({ length: 22 }, (_, i) => 10.5 - i).map((h) => (
                    <option key={h} value={h > 0 ? `+${h}` : `${h}`}>
                      {h > 0 ? `+${h}` : `${h}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <span className="font-medium">Valor:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="value"
                min="1"
                value={betForm.value}
                onChange={handleBetFormChange}
                placeholder="Valor da aposta"
                className="border rounded px-2 py-1 w-32 appearance-none"
                required
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-medium">Odds:</span>
              <input
                type="text"
                name="odds"
                value={betForm.odds}
                onChange={handleBetFormChange}
                placeholder="Ex: 1.80"
                className="border rounded px-2 py-1 w-24 appearance-none"
                required
                pattern="^\d+(\.\d+)?$"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition-colors mt-2"
            >
              Adicionar Bet
            </button>
          </form>
          <ul className="flex flex-col gap-1 mt-3">
            {bets.length === 0 && (
              <li key="no-bets" className="text-gray-500 text-sm py-2 px-2">
                Nenhuma bet adicionada.
              </li>
            )}
            {paginatedBets.map((bet, idx) => (
              <li
                key={bet.id}
                className={`border rounded p-2 flex flex-col gap-0.5 bg-gray-50 dark:bg-gray-800 transition-colors text-xs
        ${
          bet.result === "win"
            ? "border-green-600 bg-green-50 dark:bg-green-900"
            : ""
        }
        ${
          bet.result === "red" ? "border-red-600 bg-red-50 dark:bg-red-900" : ""
        }
      `}
              >
                <div className="flex flex-wrap gap-1 items-center mb-0.5">
                  <span className="text-[10px] text-gray-500">
                    {bet.date ? new Date(bet.date).toLocaleString("pt-BR") : ""}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                    style={{
                      background:
                        bet.game === "CS2"
                          ? "#1b2838"
                          : bet.game === "Valorant"
                          ? "#fa4454"
                          : bet.game === "LOL"
                          ? "#244b5a"
                          : "#666",
                    }}
                  >
                    {bet.game}
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold">
                    {bet.event}
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    {bet.tier}
                  </span>
                </div>
                <span className="font-medium text-xs">{bet.type}</span>
                <span className="text-xs">
                  {bet.teamA} vs {bet.teamB} — Aposta em:{" "}
                  {bet.selectedTeam === "A" ? bet.teamA : bet.teamB}
                  {bet.type === "Handicap" && ` | Handicap: ${bet.handicap}`}
                </span>
                <span className="text-xs">
                  Valor: R${" "}
                  {Number(bet.value).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <div className="flex gap-1 mt-1">
                  <button
                    type="button"
                    className={`bg-green-600 text-white px-2 py-0.5 rounded font-semibold transition-colors hover:bg-green-700 text-xs ${
                      bet.result === "red" ? "opacity-50" : ""
                    }`}
                    onClick={() => handleBetResult(idx, "win")}
                  >
                    Win
                  </button>
                  <button
                    type="button"
                    className={`bg-red-600 text-white px-2 py-0.5 rounded font-semibold transition-colors hover:bg-red-700 text-xs ${
                      bet.result === "win" ? "opacity-50" : ""
                    }`}
                    onClick={() => handleBetResult(idx, "red")}
                  >
                    Red
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-2">
              <button
                type="button"
                className="text-blue-600 text-xs font-semibold px-2 py-1 rounded border border-blue-200 disabled:opacity-50"
                onClick={() => setBetsPage((p) => Math.max(0, p - 1))}
                disabled={betsPage === 0}
              >
                Anterior
              </button>
              <span className="text-xs text-gray-600 self-center">
                Página {betsPage + 1} de {totalPages}
              </span>
              <button
                type="button"
                className="text-blue-600 text-xs font-semibold px-2 py-1 rounded border border-blue-200 disabled:opacity-50"
                onClick={() =>
                  setBetsPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={betsPage === totalPages - 1}
              >
                Próxima
              </button>
            </div>
          )}
        </aside>
      </div>
      <section className="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-6 flex flex-col gap-8">
        <h2 className="text-xl font-bold mb-4">Estatísticas</h2>
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div>
            <span className="block text-gray-500 text-xs">Data inicial</span>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={chartDateFrom}
              onChange={(e) => setChartDateFrom(e.target.value)}
            />
          </div>
          <div>
            <span className="block text-gray-500 text-xs">Data final</span>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={chartDateTo}
              onChange={(e) => setChartDateTo(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="ml-2 px-3 py-1 rounded border text-xs font-semibold bg-gray-100 hover:bg-gray-200"
            onClick={() => {
              setChartDateFrom("");
              setChartDateTo("");
            }}
          >
            Limpar filtro
          </button>
        </div>
        <div className="flex flex-wrap gap-6 mb-6">
          <div>
            <span className="block text-gray-500">ROI</span>
            <span className="text-2xl font-bold">{roi}%</span>
          </div>
          <div>
            <span className="block text-gray-500">Win Rate</span>
            <span className="text-2xl font-bold">{winRate}%</span>
          </div>
          <div>
            <span className="block text-gray-500">Lucro Total</span>
            <span
              className={`text-2xl font-bold ${
                lucroTotal >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {lucroTotal.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div>
            <span className="block text-gray-500">Stake Média</span>
            <span className="text-2xl font-bold">{avgStake}</span>
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="font-semibold mb-2">Evolução do Saldo</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={bankrollData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Evolução do Saldo:</b> Visualize como seu saldo acumulado
              evolui ao longo do tempo. Use para identificar períodos de
              alta/baixa performance e ajustar sua estratégia conforme a
              tendência.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Lucro por Jogo</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={lucroPorJogoArr}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="game" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lucro" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Lucro por Jogo:</b> Veja em quais jogos você tem mais lucro ou
              prejuízo. Foque nos jogos mais lucrativos e reavalie sua abordagem
              nos menos rentáveis.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Lucro por Tier</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={lucroPorTierArr}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lucro" fill="#a21caf" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Lucro por Tier:</b> Analise seu desempenho em diferentes níveis
              de torneios/eventos. Use para identificar onde sua análise é mais
              assertiva.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Lucro por Evento</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={lucroPorEventoArrTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lucro" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Lucro por Evento:</b> Descubra em quais eventos você tem mais
              sucesso. Mostrando os 10 principais.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Lucro por Tipo de Aposta</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={lucroPorTipoArr}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lucro" fill="#f59e42" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Lucro por Tipo de Aposta:</b> Avalie quais tipos de aposta
              trazem melhores resultados. Foque nos tipos mais lucrativos para
              otimizar sua gestão.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Lucro por Time Selecionado</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={lucroPorTimeRealArrTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lucro" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Lucro por Time Selecionado:</b> Veja o lucro/prejuízo para cada
              time real apostado. Mostrando os 10 principais.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Lucro por Resultado</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={lucroPorResultadoArr}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="resultado" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lucro" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Lucro por Resultado:</b> Veja o total de lucro/prejuízo em
              apostas ganhas e perdidas.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Distribuição de Odds</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={oddsDistArr}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="faixa" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="apostas" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Distribuição de Odds:</b> Veja em quais faixas de odds você
              aposta mais.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Proporção de Tipos de Aposta</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tipoDistArr}
                  dataKey="valor"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e42" />
                  <Cell fill="#a21caf" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              <b>Proporção de Tipos de Aposta:</b> Veja a distribuição dos tipos
              de aposta realizadas.
            </p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Últimas 10 apostas</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-2 py-1">Data</th>
                  <th className="px-2 py-1">Valor</th>
                  <th className="px-2 py-1">Retorno</th>
                  <th className="px-2 py-1">Resultado</th>
                  <th className="px-2 py-1">Tipo</th>
                  <th className="px-2 py-1">Jogo</th>
                  <th className="px-2 py-1">Tier</th>
                </tr>
              </thead>
              <tbody>
                {ultimasApostas.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td className="px-2 py-1">
                      {new Date(b.date).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-1">
                      {Number(b.value).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`px-2 py-1 ${
                        b.returnValue && b.returnValue >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {b.returnValue?.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-2 py-1">{b.result}</td>
                    <td className="px-2 py-1">{b.type}</td>
                    <td className="px-2 py-1">{b.game}</td>
                    <td className="px-2 py-1">{b.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
