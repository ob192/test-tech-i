"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Download,
  CalendarDays,
  X,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  isAfter,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  email: string;
  status: string;
  ftd: string;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  invalid: "bg-stone-100 text-stone-600 border-stone-200",
};

const PRESETS = [
  {
    label: "Today",
    getDates: () => {
      const d = new Date();
      return { from: d, to: d };
    },
  },
  {
    label: "Yesterday",
    getDates: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return { from: d, to: d };
    },
  },
  {
    label: "Last 7 days",
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return { from, to };
    },
  },
  {
    label: "Last 30 days",
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from, to };
    },
  },
  {
    label: "This month",
    getDates: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: "Last month",
    getDates: () => {
      const d = subMonths(new Date(), 1);
      return { from: startOfMonth(d), to: endOfMonth(d) };
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  return STATUS_COLORS[s?.toLowerCase()] ?? "bg-stone-100 text-stone-600 border-stone-200";
}

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function exportCsv(leads: Lead[], dateFrom: string, dateTo: string) {
  const header = ["id", "email", "status", "ftd"];
  const rows = leads.map((l) => [l.id, l.email, l.status, l.ftd === "1" ? "yes" : "no"]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_${dateFrom}_${dateTo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CalendarMonth ────────────────────────────────────────────────────────────

function CalendarMonth({
                         month,
                         range,
                         hovered,
                         onDayClick,
                         onDayHover,
                         onPrev,
                         onNext,
                         showPrev = true,
                         showNext = true,
                       }: {
  month: Date;
  range: DateRange;
  hovered: Date | null;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
}) {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });
  const effectiveTo = range.from && !range.to && hovered ? hovered : range.to;

  function getDayState(day: Date) {
    const isFrom = !!(range.from && isSameDay(day, range.from));
    const isTo = !!(effectiveTo && isSameDay(day, effectiveTo));
    const inRange = !!(
        range.from &&
        effectiveTo &&
        isAfter(day, range.from) &&
        isBefore(day, effectiveTo)
    );
    const isDisabled = !isSameMonth(day, month);
    return { isFrom, isTo, inRange, isDisabled };
  }

  return (
      <div className="w-[260px] select-none">
        <div className="flex items-center justify-between mb-4 px-1">
          {showPrev ? (
              <button
                  onClick={onPrev}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
          ) : (
              <div className="w-7" />
          )}
          <span className="text-sm font-semibold text-stone-800 tracking-wide">
          {format(month, "MMMM yyyy")}
        </span>
          {showNext ? (
              <button
                  onClick={onNext}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
          ) : (
              <div className="w-7" />
          )}
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
              <div
                  key={d}
                  className="text-center text-[10px] font-semibold uppercase tracking-wider text-stone-400 py-1"
              >
                {d}
              </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const { isFrom, isTo, inRange, isDisabled } = getDayState(day);
            const isHighlighted = isFrom || isTo || inRange;
            const hasRangeEnd = !!(
                effectiveTo &&
                range.from &&
                !isSameDay(range.from, effectiveTo)
            );

            return (
                <div key={i} className="relative flex items-center justify-center h-8">
                  {(inRange || (isFrom && hasRangeEnd) || (isTo && hasRangeEnd)) && (
                      <div
                          className={`absolute inset-y-0 bg-amber-100 ${
                              isFrom
                                  ? "left-1/2 right-0"
                                  : isTo
                                      ? "left-0 right-1/2"
                                      : "left-0 right-0"
                          }`}
                      />
                  )}
                  <button
                      onClick={() => !isDisabled && onDayClick(day)}
                      onMouseEnter={() => !isDisabled && onDayHover(day)}
                      onMouseLeave={() => onDayHover(null)}
                      disabled={isDisabled}
                      className={`
                  relative z-10 w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all
                  ${isDisabled ? "text-stone-300 cursor-default" : "cursor-pointer"}
                  ${
                          isFrom || isTo
                              ? "bg-stone-900 text-white font-semibold shadow-sm"
                              : inRange
                                  ? "text-amber-900 hover:bg-amber-200"
                                  : isDisabled
                                      ? ""
                                      : isToday(day)
                                          ? "text-amber-600 font-semibold hover:bg-stone-100"
                                          : "text-stone-700 hover:bg-stone-100"
                      }
                `}
                  >
                    {format(day, "d")}
                    {isToday(day) && !isHighlighted && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                    )}
                  </button>
                </div>
            );
          })}
        </div>
      </div>
  );
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────

function DateRangePicker({
                           value,
                           onChange,
                         }: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange>(value);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [leftMonth, setLeftMonth] = useState(() =>
      startOfMonth(value.from ?? new Date())
  );
  const rightMonth = addMonths(leftMonth, 1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setRange(value);
  }, [value]);

  function handleDayClick(day: Date) {
    if (!range.from || (range.from && range.to)) {
      setRange({ from: day, to: null });
    } else {
      const newRange = isBefore(day, range.from)
          ? { from: day, to: range.from }
          : { from: range.from, to: day };
      setRange(newRange);
      onChange(newRange);
      setOpen(false);
    }
  }

  function handlePreset(preset: (typeof PRESETS)[0]) {
    const r = preset.getDates();
    setRange(r);
    onChange(r);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    const empty = { from: null, to: null };
    setRange(empty);
    onChange(empty);
  }

  const displayText = range.from
      ? range.to
          ? isSameDay(range.from, range.to)
              ? format(range.from, "MMM d, yyyy")
              : `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`
          : format(range.from, "MMM d, yyyy") + " –"
      : null;

  const dayCount =
      range.from && range.to
          ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
          : null;

  return (
      <div ref={ref} className="relative">
        <button
            onClick={() => setOpen((v) => !v)}
            className={`
          group flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium
          bg-white shadow-sm transition-all w-full text-left
          ${
                open
                    ? "border-amber-400 ring-2 ring-amber-100"
                    : "border-stone-200 hover:border-stone-300 hover:shadow"
            }
        `}
        >
          <CalendarDays
              size={15}
              className={`shrink-0 transition-colors ${
                  open ? "text-amber-500" : "text-stone-400 group-hover:text-stone-600"
              }`}
          />
          <span className={`flex-1 truncate ${displayText ? "text-stone-800" : "text-stone-400"}`}>
          {displayText ?? "Select date range"}
        </span>
          {range.from && (
              <span
                  onClick={handleClear}
                  className="shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors cursor-pointer"
              >
            <X size={11} />
          </span>
          )}
        </button>

        {open && (
            <div className="absolute z-50 mt-2 left-0 rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-200/60 overflow-hidden">
              <div className="flex">
                {/* Presets sidebar */}
                <div className="border-r border-stone-100 py-3 px-2 flex flex-col gap-0.5 min-w-[130px]">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 px-2 pb-2">
                    Quick select
                  </p>
                  {PRESETS.map((p) => (
                      <button
                          key={p.label}
                          onClick={() => handlePreset(p)}
                          className="text-left text-xs font-medium text-stone-600 px-3 py-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-800 transition-colors"
                      >
                        {p.label}
                      </button>
                  ))}
                </div>

                {/* Dual calendars */}
                <div className="p-4 flex gap-6">
                  <CalendarMonth
                      month={leftMonth}
                      range={range}
                      hovered={hovered}
                      onDayClick={handleDayClick}
                      onDayHover={setHovered}
                      onPrev={() => setLeftMonth((m) => subMonths(m, 1))}
                      showNext={false}
                  />
                  <div className="w-px bg-stone-100 self-stretch" />
                  <CalendarMonth
                      month={rightMonth}
                      range={range}
                      hovered={hovered}
                      onDayClick={handleDayClick}
                      onDayHover={setHovered}
                      onNext={() => setLeftMonth((m) => addMonths(m, 1))}
                      showPrev={false}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-stone-100 px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-xs text-stone-400">
              {range.from && !range.to
                  ? "Now select an end date"
                  : dayCount
                      ? `${dayCount} day${dayCount !== 1 ? "s" : ""} selected`
                      : "Select a start date"}
            </span>
                <button
                    onClick={() => setOpen(false)}
                    disabled={!range.from || !range.to}
                    className="text-xs font-semibold bg-stone-900 text-white rounded-lg px-3 py-1.5 hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-default"
                >
                  Apply
                </button>
              </div>
            </div>
        )}
      </div>
  );
}

// ─── StatusesPage ─────────────────────────────────────────────────────────────

export default function StatusesPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [dateRange, setDateRange] = useState<DateRange>({ from: thirtyDaysAgo, to: today });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [page, setPage] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const dateFrom = dateRange.from ? toDateString(dateRange.from) : "";
  const dateTo = dateRange.to ? toDateString(dateRange.to) : "";

  const fetchStatuses = useCallback(
      async (pg = 0, silent = false) => {
        if (!dateFrom || !dateTo) {
          toast.error("Please select a date range first.");
          return;
        }
        setLoading(true);
        try {
          const res = await fetch("/api/getstatuses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date_from: `${dateFrom} 00:00:00`,
              date_to: `${dateTo} 23:59:59`,
              page: pg,
              limit: PAGE_SIZE,
            }),
          });
          const json = await res.json();

          if (json.status === true) {
            const data: Lead[] = Array.isArray(json.data) ? json.data : [];
            setLeads(data);
            setPage(pg);
            setFetched(true);
            if (!silent) {
              if (data.length === 0 && pg === 0) toast.info("No leads found for this date range.");
              else toast.success(`Loaded ${data.length} leads`);
            }
          } else {
            toast.error(json.error ?? "Failed to fetch statuses");
          }
        } catch {
          toast.error("Network error. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      [dateFrom, dateTo]
  );

  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setAutoRefresh(false);
    } else {
      fetchStatuses(page, true);
      intervalRef.current = setInterval(() => fetchStatuses(page, true), 15000);
      setAutoRefresh(true);
      toast.info("Auto-refresh every 15s");
    }
  };

  const ftdCount = leads.filter((l) => l.ftd === "1").length;
  const ftdRate =
      leads.length > 0 ? ((ftdCount / leads.length) * 100).toFixed(1) : "0.0";

  return (
      <div>
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-600 mb-2">
            <span className="w-5 h-px bg-amber-400 inline-block" />
            Overview
          </div>
          <h1
              className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight"
              style={{ fontFamily: "serif" }}
          >
            Lead Statuses
          </h1>
          <p className="mt-1.5 text-stone-500 text-sm">
            Filter leads by date range and view their current status.
          </p>
        </div>

        {/* Filter bar */}
        <div className="p-4 sm:p-5 rounded-xl border border-stone-200 bg-white shadow-sm mb-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                Date Range
              </label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="flex gap-2 sm:shrink-0">
              <button
                  onClick={() => fetchStatuses(0)}
                  disabled={loading || !dateFrom || !dateTo}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-stone-900 text-white py-2.5 px-5 font-semibold text-sm hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                Search
              </button>

              {fetched && (
                  <>
                    <button
                        onClick={() => fetchStatuses(page)}
                        disabled={loading}
                        title="Refresh"
                        className="flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 py-2.5 px-3 hover:bg-stone-50 transition-all disabled:opacity-60"
                    >
                      <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={toggleAutoRefresh}
                        title={autoRefresh ? "Stop auto-refresh" : "Auto-refresh every 15s"}
                        className={`flex items-center justify-center rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                            autoRefresh
                                ? "border-amber-400 bg-amber-50 text-amber-700"
                                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                        }`}
                    >
                      {autoRefresh ? "Live" : "Auto"}
                    </button>
                  </>
              )}
            </div>
          </div>
        </div>

        {/* Stats cards */}
        {fetched && !loading && leads.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Total Leads", value: leads.length },
                { label: "FTD", value: ftdCount },
                { label: "FTD Rate", value: `${ftdRate}%` },
              ].map(({ label, value }) => (
                  <div
                      key={label}
                      className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm text-center"
                  >
                    <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold mb-1">
                      {label}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-stone-900">{value}</p>
                  </div>
              ))}
            </div>
        )}

        {/* Empty state */}
        {!fetched && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <TrendingUp size={36} className="mb-3 opacity-30" />
              <p className="text-sm text-center">
                Select a date range and click{" "}
                <span className="font-semibold text-stone-500">Search</span> to load leads.
              </p>
            </div>
        )}

        {/* Skeleton loader */}
        {loading && (
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                  <div
                      key={i}
                      className="h-11 rounded-lg bg-stone-100 animate-pulse"
                      style={{ opacity: 1 - i * 0.1 }}
                  />
              ))}
            </div>
        )}

        {/* Table */}
        {fetched && !loading && leads.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-stone-500">
                  Page {page + 1} · {leads.length} leads
                </p>
                <button
                    onClick={() => exportCsv(leads, dateFrom, dateTo)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-100 transition-colors"
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>

              <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 w-16">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 w-28">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 w-16">
                        FTD
                      </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                    {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-stone-400">#{lead.id}</td>
                          <td className="px-4 py-3 text-stone-800 text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">
                            {lead.email}
                          </td>
                          <td className="px-4 py-3">
                        <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border capitalize ${statusColor(lead.status)}`}
                        >
                          {lead.status}
                        </span>
                          </td>
                          <td className="px-4 py-3">
                        <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${
                                lead.ftd === "1"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-stone-50 text-stone-400 border-stone-200"
                            }`}
                        >
                          {lead.ftd === "1" ? "Yes" : "No"}
                        </span>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                    onClick={() => fetchStatuses(page - 1)}
                    disabled={page === 0 || loading}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs text-stone-400">Page {page + 1}</span>
                <button
                    onClick={() => fetchStatuses(page + 1)}
                    disabled={leads.length < PAGE_SIZE || loading}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </>
        )}

        {/* No results */}
        {fetched && !loading && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <p className="text-sm">No leads found for the selected date range.</p>
            </div>
        )}
      </div>
  );
}