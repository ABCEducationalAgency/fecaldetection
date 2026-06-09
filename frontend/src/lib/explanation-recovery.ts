import {
  STAGE1_MODEL_FILENAMES,
  STAGE2_MODEL_FILENAMES,
} from "@/lib/helminth-config";
import type {
  GradcamArtifactEntry,
  PipelineRunStatus,
  StageRunStatus,
} from "@/lib/pipeline-db";

export const EXPECTED_STAGE1_GRADCAM_COUNT = STAGE1_MODEL_FILENAMES.length;
export const EXPECTED_STAGE2_GRADCAM_COUNT = STAGE2_MODEL_FILENAMES.length;

function gradcamCount(artifacts: GradcamArtifactEntry[] | null | undefined): number {
  return Array.isArray(artifacts) ? artifacts.length : 0;
}

export type ExplanationRecoveryInput = {
  status: PipelineRunStatus;
  imageObjectKey: string | null;
  stage1Status: StageRunStatus;
  stage2Status: StageRunStatus;
  stage1Gradcam: GradcamArtifactEntry[];
  stage2Gradcam: GradcamArtifactEntry[];
};

export type ExplanationRecoveryState = {
  needsRecovery: boolean;
  stage1Missing: boolean;
  stage2Missing: boolean;
  stage1Partial: boolean;
  stage2Partial: boolean;
  expectedTotal: number;
  savedTotal: number;
  descriptionLabel: string | null;
};

export function getExplanationRecoveryState(
  input: ExplanationRecoveryInput,
): ExplanationRecoveryState {
  const s1Expected =
    input.stage1Status === "finished" ? EXPECTED_STAGE1_GRADCAM_COUNT : 0;
  const s2Expected =
    input.stage2Status === "finished" ? EXPECTED_STAGE2_GRADCAM_COUNT : 0;
  const s1Count = gradcamCount(input.stage1Gradcam);
  const s2Count = gradcamCount(input.stage2Gradcam);

  const stage1Missing = s1Expected > 0 && s1Count === 0;
  const stage2Missing = s2Expected > 0 && s2Count === 0;
  const stage1Partial = s1Expected > 0 && s1Count > 0 && s1Count < s1Expected;
  const stage2Partial = s2Expected > 0 && s2Count > 0 && s2Count < s2Expected;

  const needsRecovery =
    input.status === "finished" &&
    !!input.imageObjectKey &&
    (stage1Missing || stage2Missing || stage1Partial || stage2Partial);

  let descriptionLabel: string | null = null;
  if (needsRecovery) {
    if (stage1Missing && stage2Missing) {
      descriptionLabel = "No GradCAM heatmaps were saved for this run.";
    } else if (stage1Partial || stage2Partial) {
      descriptionLabel = "Some GradCAM heatmaps are missing from this run.";
    } else if (stage1Missing) {
      descriptionLabel = "Stage 1 GradCAM heatmaps were not saved.";
    } else if (stage2Missing) {
      descriptionLabel = "Stage 2 GradCAM heatmaps were not saved.";
    }
  }

  return {
    needsRecovery,
    stage1Missing,
    stage2Missing,
    stage1Partial,
    stage2Partial,
    expectedTotal: s1Expected + s2Expected,
    savedTotal: s1Count + s2Count,
    descriptionLabel,
  };
}
