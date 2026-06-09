import { toast } from "sonner";

export type ExplanationUploadKind = "gradcam" | "lime";

export type ExplanationUploadFailure = {
  modelFilename: string;
  message: string;
};

export type ExplanationUploadParams = {
  runId: string;
  stage: 1 | 2 | 3;
  kind: ExplanationUploadKind;
  modelFilename: string;
  dataUrl: string;
  numSamples?: number;
  headers?: Record<string, string>;
  onFailure?: (failure: ExplanationUploadFailure) => void;
  onSuccess?: (modelFilename: string) => void;
};

const toastedModels = new Set<string>();

function toastKey(
  runId: string,
  kind: ExplanationUploadKind,
  modelFilename: string,
): string {
  return `${runId}:${kind}:${modelFilename}`;
}

/** Fire-and-forget POST of one PNG explanation artifact to the run's storage prefix. */
export async function uploadExplanationArtifact(
  params: ExplanationUploadParams,
): Promise<boolean> {
  const {
    runId,
    stage,
    kind,
    modelFilename,
    dataUrl,
    numSamples,
    headers,
    onFailure,
    onSuccess,
  } = params;

  try {
    const blob = await (await fetch(dataUrl)).blob();
    const fd = new FormData();
    fd.set("stage", String(stage));
    fd.set("modelFilename", modelFilename);
    fd.set("file", blob, `${kind}.png`);
    if (kind === "lime" && typeof numSamples === "number") {
      fd.set("numSamples", String(numSamples));
    }

    const res = await fetch(
      `/api/predictions/pipeline-run/${encodeURIComponent(runId)}/explanations/${kind}`,
      {
        method: "POST",
        body: fd,
        credentials: "include",
        headers,
      },
    );

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      const message = data?.error?.trim() || res.statusText || "Upload failed.";
      onFailure?.({ modelFilename, message });

      const key = toastKey(runId, kind, modelFilename);
      if (!toastedModels.has(key)) {
        toastedModels.add(key);
        toast.error(
          kind === "gradcam" ? "Could not save heatmap" : "Could not save LIME image",
          { description: `${shortModelLabel(modelFilename)}: ${message}` },
        );
      }
      return false;
    }

    onSuccess?.(modelFilename);
    return true;
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : "Network error while uploading.";
    onFailure?.({ modelFilename, message });

    const key = toastKey(runId, kind, modelFilename);
    if (!toastedModels.has(key)) {
      toastedModels.add(key);
      toast.error(
        kind === "gradcam" ? "Could not save heatmap" : "Could not save LIME image",
        { description: `${shortModelLabel(modelFilename)}: ${message}` },
      );
    }
    return false;
  }
}

export function resetExplanationUploadToasts(runId: string): void {
  for (const key of toastedModels) {
    if (key.startsWith(`${runId}:`)) {
      toastedModels.delete(key);
    }
  }
}

export function summarizeUploadFailures(
  failures: ExplanationUploadFailure[],
  kind: ExplanationUploadKind = "gradcam",
): void {
  if (failures.length === 0) return;
  const label = kind === "gradcam" ? "heatmaps" : "LIME images";
  toast.warning(`Some ${label} were not saved`, {
    description: `${failures.length} upload(s) failed. Open this run in History to retry.`,
  });
}

function shortModelLabel(filename: string): string {
  return filename
    .replace(/\.keras$/i, "")
    .replace(/^HELMINTHS_BINARY_/i, "")
    .replace(/^BINARY_/i, "");
}
