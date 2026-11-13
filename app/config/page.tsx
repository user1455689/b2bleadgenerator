"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ScoringConfig, AIProvider } from "@/types/lead";
import {
  Sliders,
  CheckCircle2,
  RotateCcw,
  Save,
  Cpu,
  Key,
  Eye,
  EyeOff,
  Zap,
  AlertCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";

export default function AgentConfigurationPage() {
  const [config, setConfig] = useState<ScoringConfig>({
    id: "default",
    config_name: "default",
    ai_provider: "gemini",
    ai_api_key: "",
    ai_model: "gemini-1.5-flash",
    industry_weight: 25,
    scale_weight: 20,
    inventory_complexity_weight: 20,
    accounting_needs_weight: 15,
    contact_availability_weight: 10,
    buying_intent_weight: 10,
    minimum_qualify_score: 60,
    max_leads_per_day: 250,
    auto_research_new_leads: true,
    updated_at: new Date().toISOString(),
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // AI Connection Test state
  const [testingAI, setTestingAI] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setConfig((prev) => ({
            ...prev,
            ...d.config,
            ai_provider: d.config.ai_provider || "gemini",
            ai_model: d.config.ai_model || "gemini-1.5-flash",
            ai_api_key: d.config.ai_api_key || "",
          }));
        }
      });
  }, []);

  const totalWeights =
    config.industry_weight +
    config.scale_weight +
    config.inventory_complexity_weight +
    config.accounting_needs_weight +
    config.contact_availability_weight +
    config.buying_intent_weight;

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingAI(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.ai_provider || "gemini",
          apiKey: config.ai_api_key,
          model: config.ai_model,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          latencyMs: data.latencyMs,
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || "Connection test failed",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Network error while testing connection",
      });
    } finally {
      setTestingAI(false);
    }
  };

  const handleReset = () => {
    setConfig({
      ...config,
      industry_weight: 25,
      scale_weight: 20,
      inventory_complexity_weight: 20,
      accounting_needs_weight: 15,
      contact_availability_weight: 10,
      buying_intent_weight: 10,
      minimum_qualify_score: 60,
    });
  };

  const getRecommendedModels = (provider?: AIProvider) => {
    switch (provider) {
      case "gemini":
        return [
          { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Recommended • Fast, Verified Active)" },
          { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Deep Research & Complex Qualification)" },
          { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Next-Gen Ultra Fast)" },
        ];
      case "openai":
        return [
          { id: "gpt-4o-mini", name: "GPT-4o Mini (Cost-efficient)" },
          { id: "gpt-4o", name: "GPT-4o (Flagship reasoning)" },
        ];
      case "claude":
        return [
          { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (State-of-the-art analysis)" },
          { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Fast & lightweight)" },
        ];
      case "groq":
        return [
          { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Sub-second inference)" },
          { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (High speed)" },
        ];
      case "ollama":
        return [
          { id: "llama3", name: "Llama 3 (Local on localhost:11434)" },
          { id: "mistral", name: "Mistral 7B (Local)" },
        ];
      default:
        return [{ id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" }];
    }
  };

  return (
    <div className="flex-1 pb-16">
      <AppHeader
        title="Agent & AI Engine Configuration"
        subtitle="Manage multi-provider AI credentials (Gemini, OpenAI, Claude), scoring dimensions, and qualification thresholds"
      />

      <main className="px-8 py-6 space-y-6 max-w-4xl">
        {savedSuccess && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Settings successfully saved to database and live runtime cache.</span>
          </div>
        )}

        {/* AI Provider & API Key Configuration Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-brand-600" />
                <span>AI Provider & LLM Engine Settings</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your Google Gemini API key or switch between supported models with automatic heuristic fallback
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Multi-Provider Ready
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* AI Provider Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Active AI Provider</span>
              </label>
              <select
                value={config.ai_provider || "gemini"}
                onChange={(e) => {
                  const newProvider = e.target.value as AIProvider;
                  const models = getRecommendedModels(newProvider);
                  setConfig({
                    ...config,
                    ai_provider: newProvider,
                    ai_model: models[0]?.id || "",
                  });
                  setTestResult(null);
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="gemini">Google Gemini (Recommended - Fast & Structured)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="claude">Anthropic Claude (Sonnet 3.5)</option>
                <option value="groq">Groq Cloud (Llama 3.3 70B)</option>
                <option value="ollama">Ollama (Local Private Self-Hosted)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                You can enter your own API key below or set it in <code className="font-mono text-brand-600 bg-brand-50 dark:bg-brand-950/50 px-1 py-0.5 rounded">superadmin/.env.local</code>.
              </p>
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                LLM Model Identifier
              </label>
              <select
                value={config.ai_model || "gemini-1.5-flash"}
                onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {getRecommendedModels(config.ai_provider).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Used by Agent 2 (Intelligence) and Agent 3 (Personalized Sales Drafts).
              </p>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {config.ai_provider === "gemini"
                      ? "Gemini API Key"
                      : `${(config.ai_provider || "AI").toUpperCase()} API Key`}
                  </span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  {config.ai_api_key ? "Configured in Database" : "Using environment fallback if set"}
                </span>
              </label>

              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder={
                    config.ai_provider === "gemini"
                      ? "AIzaSy..."
                      : config.ai_provider === "openai"
                      ? "sk-proj-..."
                      : config.ai_provider === "ollama"
                      ? "Not required for local Ollama"
                      : "Enter API key here"
                  }
                  value={config.ai_api_key || ""}
                  onChange={(e) => setConfig({ ...config, ai_api_key: e.target.value })}
                  disabled={config.ai_provider === "ollama"}
                  className="w-full h-10 pl-3 pr-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                />
                <div className="absolute right-2 top-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingAI}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900 transition-colors disabled:opacity-50"
                  >
                    {testingAI ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3 w-3" />
                        <span>Test Ping</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`mt-2 p-3 rounded-xl border text-xs flex items-center justify-between ${
                    testResult.success
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                      : "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message || testResult.error}</span>
                  </div>
                  {testResult.latencyMs !== undefined && (
                    <span className="font-mono text-[11px] font-bold opacity-80">
                      {testResult.latencyMs} ms
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-start gap-1.5 pt-1 text-[11px] text-slate-400">
                <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>
                  <strong>Tip:</strong> If you leave this field empty, the server automatically reads from{" "}
                  <code className="text-slate-600 dark:text-slate-300 font-mono">
                    superadmin/.env.local (GEMINI_API_KEY)
                  </code>
                  . If no key is set or the API is unreachable, the system automatically runs the high-fidelity
                  Nepalese heuristic engine so discovery and qualification never freeze.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weights Matrix Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-brand-600" />
                <span>6-Dimensional Weight Matrix (0 - 100 Points)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust how aggressively each dimension influences a prospect&apos;s qualification score
              </p>
            </div>

            <div className="text-right">
              <span
                className={`text-sm font-black font-mono ${
                  totalWeights === 100 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                Total: {totalWeights} / 100 pts
              </span>
              {totalWeights !== 100 && (
                <p className="text-[10px] text-rose-500 font-medium">Weights must equal 100</p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {[
              {
                key: "industry_weight",
                label: "1. Industry Relevance",
                desc: "Priority given to core verticals (FMCG Wholesale, Pharma, Hardware, Tiles, Furniture Mfg, Retail)",
                val: config.industry_weight,
                max: 40,
              },
              {
                key: "scale_weight",
                label: "2. Business Scale",
                desc: "Enterprise vs SME footprint, fleet size, estimated employees and distribution volume",
                val: config.scale_weight,
                max: 30,
              },
              {
                key: "inventory_complexity_weight",
                label: "3. Inventory Complexity",
                desc: "High SKU counts, batch/lot expiry tracking, multi-godown transit, carton-to-piece dual packing",
                val: config.inventory_complexity_weight,
                max: 30,
              },
              {
                key: "accounting_needs_weight",
                label: "4. Accounting & IRD Invoicing Requirements",
                desc: "Mandatory VAT billing compliance, CBMS sync, legacy desktop Tally/Busy migration need",
                val: config.accounting_needs_weight,
                max: 25,
              },
              {
                key: "contact_availability_weight",
                label: "5. Contact Reachability",
                desc: "Verified direct phone line, business email, and confirmed street address",
                val: config.contact_availability_weight,
                max: 20,
              },
              {
                key: "buying_intent_weight",
                label: "6. Buying Intent & Growth Signals",
                desc: "Active expansion, hiring accountants, modernizing software, public trade inquiries",
                val: config.buying_intent_weight,
                max: 20,
              },
            ].map((slider) => (
              <div key={slider.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{slider.label}</span>
                    <p className="text-[11px] text-slate-400">{slider.desc}</p>
                  </div>
                  <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
                    {slider.val} pts
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={slider.max}
                  value={slider.val}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      [slider.key]: Number(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            ))}
          </div>

          {/* Thresholds and Automation settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-900 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                Minimum Qualification Score (0 - 100)
              </label>
              <input
                type="number"
                value={config.minimum_qualify_score}
                onChange={(e) =>
                  setConfig({ ...config, minimum_qualify_score: Number(e.target.value) })
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400">
                Leads scoring at or above this threshold will be flagged as &apos;Qualified&apos;.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                Max Daily Lead Discovery Quota
              </label>
              <input
                type="number"
                value={config.max_leads_per_day}
                onChange={(e) =>
                  setConfig({ ...config, max_leads_per_day: Number(e.target.value) })
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400">
                Enforces strict rate limits to prevent provider quota overages.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-900">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || totalWeights !== 100}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Config..." : "Save Configuration"}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
