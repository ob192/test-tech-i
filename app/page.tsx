"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus, CheckCircle2, Copy, Check } from "lucide-react";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

interface SuccessData {
  id: string;
  email: string;
  autologin: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-green-700 underline underline-offset-2 hover:text-green-900 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy autologin"}
    </button>
  );
}

export default function AddLeadPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [urlParams, setUrlParams] = useState({ clickId: "", custom1: "", custom2: "", custom3: "" });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const formFields = ["firstName", "lastName", "phone", "email"] as const;
    formFields.forEach((key) => {
      const val = p.get(key);
      if (val) setValue(key, val);
    });
    setUrlParams({
      clickId: p.get("click_id") ?? p.get("clickId") ?? "",
      custom1: p.get("custom1") ?? "",
      custom2: p.get("custom2") ?? "",
      custom3: p.get("custom3") ?? "",
    });
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setSuccess(null);
    try {
      const res = await fetch("/api/addlead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...urlParams }),
      });
      const json = await res.json();

      if (json.status === true) {
        setSuccess({ id: json.id, email: json.email, autologin: json.autologin });
        toast.success("Lead submitted successfully!");
        reset();
      } else {
        toast.error(json.error ?? "Failed to submit lead");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-600 mb-2">
          <span className="w-5 h-px bg-amber-400 inline-block" />
          New Submission
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight" style={{ fontFamily: "serif" }}>
          Add a Lead
        </h1>
        <p className="mt-2 text-stone-500 text-sm">Fill in the details below to register a new lead.</p>
      </div>

      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={18} />
          <div className="min-w-0">
            <p className="font-semibold text-green-800 text-sm">Lead registered!</p>
            <p className="text-xs text-green-700 mt-0.5 truncate">
              ID: <span className="font-mono">{success.id}</span> · {success.email}
            </p>
            {success.autologin && (
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={success.autologin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 underline underline-offset-2 truncate max-w-[180px]"
                >
                  {success.autologin}
                </a>
                <CopyButton text={success.autologin} />
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              { name: "firstName", label: "First Name", placeholder: "John", type: "text", full: false },
              { name: "lastName", label: "Last Name", placeholder: "Doe", type: "text", full: false },
              { name: "phone", label: "Phone", placeholder: "+44 7700 900000", type: "tel", full: true },
              { name: "email", label: "Email", placeholder: "john@example.com", type: "email", full: true },
            ] as const
          ).map(({ name, label, placeholder, type, full }) => (
            <div key={name} className={full ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                {label} <span className="text-amber-500">*</span>
              </label>
              <input
                {...register(name)}
                type={type}
                placeholder={placeholder}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white text-stone-900 placeholder-stone-400 outline-none transition-all
                  focus:ring-2 focus:ring-amber-400 focus:border-amber-400
                  ${errors[name] ? "border-red-400 ring-1 ring-red-300" : "border-stone-200 hover:border-stone-300"}`}
              />
              {errors[name] && (
                <p className="mt-1 text-xs text-red-500">{errors[name]?.message}</p>
              )}
            </div>
          ))}
        </div>

        {urlParams.clickId && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs text-blue-700">
            <span className="font-semibold">click_id detected:</span>{" "}
            <span className="font-mono">{urlParams.clickId}</span>
          </div>
        )}

        <div className="rounded-lg bg-stone-100 border border-stone-200 px-4 py-2.5 text-xs text-stone-500">
          <span className="font-semibold text-stone-600">Static:</span>{" "}
          box_id=28 · offer_id=5 · country=GB · lang=en
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 text-white py-3 px-6 font-semibold text-sm
            hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Submitting…</>
          ) : (
            <><UserPlus size={15} /> Submit Lead</>
          )}
        </button>
      </form>
    </div>
  );
}
