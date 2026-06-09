"use client";

import {
  ExplanationsTabs,
  type ExplanationsTabsProps,
} from "@/components/dashboard/explanations-tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { extractGradcamPayload } from "@/lib/explanation-ws";
import {
  EXPECTED_STAGE1_GRADCAM_COUNT,
  EXPECTED_STAGE2_GRADCAM_COUNT,
  getExplanationRecoveryState,
} from "@/lib/explanation-recovery";
import {
  resetExplanationUploadToasts,
  summarizeUploadFailures,
  uploadExplanationArtifact,
  type ExplanationUploadFailure,
} from "@/lib/explanation-upload";
import {
  STAGE1_MODEL_FILENAMES,
  STAGE2_MODEL_FILENAMES,
  getStage1GradcamWsUrl,
  getStage2GradcamWsUrl,
} from "@/lib/helminth-config";
import { AlertCircle, Loader2, ScanEye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type HistoryExplanationsSectionProps = ExplanationsTabsProps & {
  imageObjectKey: string | null;
  cacheHit: boolean;
  runStatus: "processing" | "finished" | "failed" | "timed_out";
  predictionApiDelegateToken: string | null;
};

type StageGenState = {
  phase: "idle" | "loading" | "complete" | "error";
  saved: number;
  expected: number;
  connectionError: string | null;
};

const INITIAL_STAGE: StageGenState = {
  phase: "idle",
  saved: 0,
  expected: 0,
  connectionError: null,
};

export function HistoryExplanationsSection({
  runId,
  runStatus,
  imageObjectKey,
  cacheHit,
  predictionApiDelegateToken,
  stage1Status,
  stage2Status,
  stage1Gradcam,
  stage2Gradcam,
  ...tabsProps
}: HistoryExplanationsSectionProps) {
  const router = useRouter();
  const delegateAuthHeaders = useMemo(
    () =>
      predictionApiDelegateToken
        ? { Authorization: `Bearer ${predictionApiDelegateToken}` }
        : undefined,
    [predictionApiDelegateToken],
  );

  const recovery = useMemo(
    () =>
      getExplanationRecoveryState({
        status: runStatus,
        imageObjectKey,
        stage1Status,
        stage2Status,
        stage1Gradcam,
        stage2Gradcam,
      }),
    [
      runStatus,
      imageObjectKey,
      stage1Status,
      stage2Status,
      stage1Gradcam,
      stage2Gradcam,
    ],
  );

  const [busy, setBusy] = useState(false);
  const [stage1Gen, setStage1Gen] = useState<StageGenState>(INITIAL_STAGE);
  const [stage2Gen, setStage2Gen] = useState<StageGenState>(INITIAL_STAGE);
  const [uploadFailures, setUploadFailures] = useState<ExplanationUploadFailure[]>([]);

  const stage1WsRef = useRef<WebSocket | null>(null);
  const stage2WsRef = useRef<WebSocket | null>(null);
  const stage1PingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stage2PingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stage1SessionRef = useRef(0);
  const stage2SessionRef = useRef(0);
  const stage1UploadedRef = useRef(new Set<string>());
  const stage2UploadedRef = useRef(new Set<string>());
  const failuresRef = useRef<ExplanationUploadFailure[]>([]);

  const teardownStage1Ws = useCallback(() => {
    if (stage1PingRef.current) {
      clearInterval(stage1PingRef.current);
      stage1PingRef.current = null;
    }
    if (stage1WsRef.current) {
      stage1WsRef.current.close();
      stage1WsRef.current = null;
    }
  }, []);

  const teardownStage2Ws = useCallback(() => {
    if (stage2PingRef.current) {
      clearInterval(stage2PingRef.current);
      stage2PingRef.current = null;
    }
    if (stage2WsRef.current) {
      stage2WsRef.current.close();
      stage2WsRef.current = null;
    }
  }, []);

  const recordFailure = useCallback((failure: ExplanationUploadFailure) => {
    failuresRef.current = [...failuresRef.current, failure];
    setUploadFailures(failuresRef.current);
  }, []);

  const uploadGradcam = useCallback(
    (stage: 1 | 2, modelFilename: string, dataUrl: string) => {
      void uploadExplanationArtifact({
        runId,
        stage,
        kind: "gradcam",
        modelFilename,
        dataUrl,
        headers: delegateAuthHeaders,
        onFailure: recordFailure,
        onSuccess: () => {
          if (stage === 1) {
            setStage1Gen((prev) => ({ ...prev, saved: prev.saved + 1 }));
          } else {
            setStage2Gen((prev) => ({ ...prev, saved: prev.saved + 1 }));
          }
        },
      });
    },
    [delegateAuthHeaders, recordFailure, runId],
  );

  const connectStage1Gradcam = useCallback(
    (jobId: string): Promise<void> =>
      new Promise((resolve) => {
        teardownStage1Ws();
        stage1UploadedRef.current = new Set();
        const sessionId = ++stage1SessionRef.current;
        const expected = EXPECTED_STAGE1_GRADCAM_COUNT;

        setStage1Gen({
          phase: "loading",
          saved: 0,
          expected,
          connectionError: null,
        });

        let ws: WebSocket;
        try {
          ws = new WebSocket(getStage1GradcamWsUrl(jobId));
        } catch {
          setStage1Gen((prev) => ({
            ...prev,
            phase: "error",
            connectionError: "Could not open Grad CAM connection.",
          }));
          resolve();
          return;
        }
        stage1WsRef.current = ws;

        ws.onopen = () => {
          if (sessionId !== stage1SessionRef.current) return;
          stage1PingRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send("ping");
          }, 15000);
        };

        ws.onmessage = (evt) => {
          if (sessionId !== stage1SessionRef.current) return;
          try {
            const raw = JSON.parse(String(evt.data)) as unknown;
            const parsed = extractGradcamPayload(raw, STAGE1_MODEL_FILENAMES);
            if (
              parsed.modelKey &&
              parsed.imageSrc &&
              !stage1UploadedRef.current.has(parsed.modelKey)
            ) {
              stage1UploadedRef.current.add(parsed.modelKey);
              uploadGradcam(1, parsed.modelKey, parsed.imageSrc);
            }

            if (parsed.isFinished) {
              setStage1Gen((prev) => ({
                ...prev,
                phase: "complete",
              }));
              teardownStage1Ws();
              resolve();
            }
          } catch {
            /* ignore malformed frames */
          }
        };

        ws.onerror = () => {
          setStage1Gen((prev) =>
            prev.phase === "loading"
              ? {
                  ...prev,
                  phase: "error",
                  connectionError: "Grad CAM connection failed.",
                }
              : prev,
          );
          teardownStage1Ws();
          resolve();
        };

        ws.onclose = () => {
          if (stage1PingRef.current) {
            clearInterval(stage1PingRef.current);
            stage1PingRef.current = null;
          }
          stage1WsRef.current = null;
        };
      }),
    [teardownStage1Ws, uploadGradcam],
  );

  const connectStage2Gradcam = useCallback(
    (jobId: string): Promise<void> =>
      new Promise((resolve) => {
        teardownStage2Ws();
        stage2UploadedRef.current = new Set();
        const sessionId = ++stage2SessionRef.current;
        const expected = EXPECTED_STAGE2_GRADCAM_COUNT;

        setStage2Gen({
          phase: "loading",
          saved: 0,
          expected,
          connectionError: null,
        });

        let ws: WebSocket;
        try {
          ws = new WebSocket(getStage2GradcamWsUrl(jobId));
        } catch {
          setStage2Gen((prev) => ({
            ...prev,
            phase: "error",
            connectionError: "Could not open Grad CAM connection.",
          }));
          resolve();
          return;
        }
        stage2WsRef.current = ws;

        ws.onopen = () => {
          if (sessionId !== stage2SessionRef.current) return;
          stage2PingRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send("ping");
          }, 15000);
        };

        ws.onmessage = (evt) => {
          if (sessionId !== stage2SessionRef.current) return;
          try {
            const raw = JSON.parse(String(evt.data)) as unknown;
            const parsed = extractGradcamPayload(raw, STAGE2_MODEL_FILENAMES);
            if (
              parsed.modelKey &&
              parsed.imageSrc &&
              !stage2UploadedRef.current.has(parsed.modelKey)
            ) {
              stage2UploadedRef.current.add(parsed.modelKey);
              uploadGradcam(2, parsed.modelKey, parsed.imageSrc);
            }

            if (parsed.isFinished) {
              setStage2Gen((prev) => ({
                ...prev,
                phase: "complete",
              }));
              teardownStage2Ws();
              resolve();
            }
          } catch {
            /* ignore malformed frames */
          }
        };

        ws.onerror = () => {
          setStage2Gen((prev) =>
            prev.phase === "loading"
              ? {
                  ...prev,
                  phase: "error",
                  connectionError: "Grad CAM connection failed.",
                }
              : prev,
          );
          teardownStage2Ws();
          resolve();
        };

        ws.onclose = () => {
          if (stage2PingRef.current) {
            clearInterval(stage2PingRef.current);
            stage2PingRef.current = null;
          }
          stage2WsRef.current = null;
        };
      }),
    [teardownStage2Ws, uploadGradcam],
  );

  const startRecovery = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    failuresRef.current = [];
    setUploadFailures([]);
    resetExplanationUploadToasts(runId);

    try {
      const res = await fetch(
        `/api/predictions/pipeline-run/${encodeURIComponent(runId)}/start-explanations`,
        {
          method: "POST",
          credentials: "include",
          headers: delegateAuthHeaders,
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        stage1?: { externalJobId: string };
        stage2?: { externalJobId: string };
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not start explanations.");
      }

      if (data.stage1?.externalJobId) {
        await connectStage1Gradcam(data.stage1.externalJobId);
      }
      if (data.stage2?.externalJobId) {
        await connectStage2Gradcam(data.stage2.externalJobId);
      }

      if (failuresRef.current.length > 0) {
        summarizeUploadFailures(failuresRef.current, "gradcam");
      } else {
        toast.success("Heatmaps saved", {
          description: "GradCAM images were stored for this run.",
        });
      }

      router.refresh();
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Could not generate heatmaps.";
      toast.error("Heatmaps unavailable", { description: message });
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    connectStage1Gradcam,
    connectStage2Gradcam,
    delegateAuthHeaders,
    router,
    runId,
  ]);

  const hasAnyArtifacts =
    stage1Gradcam.length +
      stage2Gradcam.length +
      tabsProps.stage1Lime.length +
      tabsProps.stage2Lime.length +
      tabsProps.stage3Lime.length >
    0;

  const generating = busy || stage1Gen.phase === "loading" || stage2Gen.phase === "loading";
  const totalSaved = stage1Gen.saved + stage2Gen.saved;
  const totalExpected =
    (stage1Gen.expected > 0 ? stage1Gen.expected : 0) +
    (stage2Gen.expected > 0 ? stage2Gen.expected : 0);
  const connectionError = stage1Gen.connectionError || stage2Gen.connectionError;

  const cacheHint = cacheHit
    ? "This run reused cached predictions, so heatmaps were not generated automatically."
    : "Heatmaps may be missing if the live connection dropped or uploads failed during the original run.";

  return (
    <div className="space-y-4">
      {recovery.needsRecovery ? (
        <Card className="mt-8 border-dashed border-primary/30 bg-primary/[0.04]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanEye className="size-4 text-primary" aria-hidden />
              Generate heatmaps
            </CardTitle>
            <CardDescription>
              {recovery.descriptionLabel} {cacheHint}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              className="cursor-pointer gap-1.5"
              disabled={generating || !predictionApiDelegateToken}
              onClick={() => void startRecovery()}
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Generating heatmaps…
                </>
              ) : (
                "Generate heatmaps"
              )}
            </Button>

            {!predictionApiDelegateToken ? (
              <p className="text-sm text-destructive">
                Session token unavailable. Refresh the page and try again.
              </p>
            ) : null}

            {generating && totalExpected > 0 ? (
              <p
                className="text-sm text-muted-foreground"
                aria-live="polite"
                role="status"
              >
                Saving heatmaps… {totalSaved}/{totalExpected}
              </p>
            ) : null}

            {connectionError ? (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {connectionError}
              </p>
            ) : null}

            {uploadFailures.length > 0 ? (
              <ul className="space-y-1 text-sm text-destructive">
                {uploadFailures.map((f) => (
                  <li key={f.modelFilename} className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      {f.modelFilename}: {f.message}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {hasAnyArtifacts ? (
        <ExplanationsTabs
          runId={runId}
          stage1Status={stage1Status}
          stage2Status={stage2Status}
          stage1Gradcam={stage1Gradcam}
          stage2Gradcam={stage2Gradcam}
          {...tabsProps}
        />
      ) : null}
    </div>
  );
}
