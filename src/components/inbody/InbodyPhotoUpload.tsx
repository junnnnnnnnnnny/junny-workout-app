"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fileToResizedBase64 } from "@/lib/image-utils";
import { postJson } from "@/lib/api-client";

const MAX_FILES = 3;

export interface InbodyAnalysis {
  weightKg: number | null;
  skeletalMuscleMassKg: number | null;
  bodyFatMassKg: number | null;
  bodyFatPercent: number | null;
  bmi: number | null;
  bmrKcal: number | null;
  waistHipRatio: number | null;
  visceralFatLevel: number | null;
}

export function InbodyPhotoUpload({ onAnalyzed }: { onAnalyzed: (data: InbodyAnalysis) => void }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;
    setNotice(null);
    setFiles((prev) => {
      const combined = [...prev, ...incoming].slice(0, MAX_FILES);
      if (prev.length + incoming.length > MAX_FILES) {
        setNotice(`인바디 사진은 최대 ${MAX_FILES}장까지 올릴 수 있어요.`);
      }
      return combined;
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function analyze() {
    if (!user || files.length === 0) return;
    setAnalyzing(true);
    setNotice(null);
    try {
      const images = await Promise.all(files.map((f) => fileToResizedBase64(f)));
      const token = await user.getIdToken();
      const data = await postJson<InbodyAnalysis>("/api/inbody/analyze", token, { images });
      onAnalyzed(data);
      setFiles([]);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "분석에 실패했어요.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className="cursor-pointer rounded-2xl border border-dashed bg-white p-7 text-center transition"
        style={{ borderColor: dragOver ? "var(--color-brand)" : "var(--color-dashed)" }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="text-[13px] font-bold text-muted-dark">인바디 결과지 사진 올리기</div>
        <div className="mt-1 text-[11px] text-muted">
          탭하거나 드래그해서 업로드 (최대 {MAX_FILES}장, 자동 수치 인식)
        </div>
      </label>

      {previews.length > 0 && (
        <div className="flex gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <button
                onClick={() => removeFile(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white"
                aria-label="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={analyze}
          disabled={analyzing}
          className="rounded-xl bg-brand py-3 text-center text-[13px] font-bold text-white disabled:opacity-50"
        >
          {analyzing ? "분석 중..." : `사진 ${files.length}장 분석하기`}
        </button>
      )}

      {notice && <div className="text-xs font-semibold text-brand">{notice}</div>}
    </div>
  );
}
