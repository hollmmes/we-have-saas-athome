import type {
  ImagePreset,
  NotificationSettings,
  QueueJob,
  SavedPalette,
  SeoPreset,
  VideoPreset,
  WatchFolder,
  WatchFolderTool,
  WorkflowPreset,
  WorkflowProfile,
} from "./types";
import { isImagePath, isVideoPath, joinPath } from "./utils/helpers";

const STORAGE_KEYS = {
  presets: "workflow.presets",
  jobs: "workflow.jobs",
  palettes: "workflow.palettes",
  watchFolders: "workflow.watchFolders",
  notifications: "workflow.notifications",
  profiles: "workflow.profiles",
  activeProfileId: "workflow.activeProfileId",
};

const workflowEvents = new EventTarget();
const retryHandlers = new Map<string, (payload: unknown) => Promise<void>>();
const watchProcessors = new Map<
  WatchFolderTool,
  (paths: string[], folder: WatchFolder) => Promise<void>
>();

let watchTimer: number | null = null;
let watchPollInProgress = false;

const DEFAULT_IMAGE_PRESET_ID = "preset-image-webp";
const DEFAULT_VIDEO_PRESET_ID = "preset-video-balanced";
const DEFAULT_SEO_PRESET_ID = "preset-seo-default";

const DEFAULT_PRESETS: WorkflowPreset[] = [
  {
    id: DEFAULT_IMAGE_PRESET_ID,
    type: "image",
    name: "WebP Balanced",
    format: "webp",
    quality: 85,
    suffix: "balanced",
    keepOriginalName: true,
    watermarkEnabled: false,
    watermarkText: "",
    watermarkPosition: "bottom-right",
    watermarkOpacity: 44,
  },
  {
    id: "preset-image-jpg-small",
    type: "image",
    name: "JPG Small",
    format: "jpg",
    quality: 72,
    suffix: "small",
    keepOriginalName: true,
    watermarkEnabled: false,
    watermarkText: "",
    watermarkPosition: "bottom-right",
    watermarkOpacity: 44,
  },
  {
    id: DEFAULT_VIDEO_PRESET_ID,
    type: "video",
    name: "Video Balanced",
    quality: "medium",
    mode: "optimize",
    suffix: "optimized",
    trimStart: "",
    trimEnd: "",
    normalizeAudio: false,
  },
  {
    id: "preset-video-smallest",
    type: "video",
    name: "Video Smallest",
    quality: "verylow",
    mode: "optimize",
    suffix: "smallest",
    trimStart: "",
    trimEnd: "",
    normalizeAudio: false,
  },
  {
    id: DEFAULT_SEO_PRESET_ID,
    type: "seo",
    name: "SEO Default",
    maxLength: 150,
    titleTemplate: "{primary} | {secondary}",
    descriptionTemplate: "{primary}, {secondary}, {keywords}",
  },
];

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  sslThresholdDays: 14,
  domainThresholdDays: 30,
  queueSuccess: false,
  queueFailure: true,
  watchFolderEvents: true,
};

const DEFAULT_PROFILE: WorkflowProfile = {
  id: "profile-default",
  name: "Default Workspace",
  imagePresetId: DEFAULT_IMAGE_PRESET_ID,
  videoPresetId: DEFAULT_VIDEO_PRESET_ID,
  seoPresetId: DEFAULT_SEO_PRESET_ID,
  watermarkText: "",
  notes: "General purpose defaults for daily work.",
};

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function readStorage<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse workflow storage key ${key}:`, error);
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function emitWorkflowChange(section: string) {
  workflowEvents.dispatchEvent(
    new CustomEvent("workflow:change", {
      detail: { section },
    }),
  );
}

export function subscribeWorkflowChanges(
  listener: (section: string) => void,
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ section: string }>;
    listener(customEvent.detail.section);
  };

  workflowEvents.addEventListener("workflow:change", handler);
  return () => workflowEvents.removeEventListener("workflow:change", handler);
}

export function notifyApp(
  kind: "info" | "success" | "warning" | "error",
  message: string,
) {
  workflowEvents.dispatchEvent(
    new CustomEvent("workflow:toast", {
      detail: { kind, message },
    }),
  );

  if (typeof Notification === "undefined") {
    return;
  }

  const settings = getNotificationSettings();
  if (!settings.enabled || Notification.permission !== "granted") {
    return;
  }

  void new Notification("We Have SaaS at Home", {
    body: message,
  });
}

export function subscribeToasts(
  listener: (detail: { kind: string; message: string }) => void,
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ kind: string; message: string }>;
    listener(customEvent.detail);
  };

  workflowEvents.addEventListener("workflow:toast", handler);
  return () => workflowEvents.removeEventListener("workflow:toast", handler);
}

export async function requestWorkflowNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }

  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

export function initWorkflowState() {
  if (getPresets().length === 0) {
    writeStorage(STORAGE_KEYS.presets, DEFAULT_PRESETS);
  }

  if (getProfiles().length === 0) {
    writeStorage(STORAGE_KEYS.profiles, [DEFAULT_PROFILE]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
    writeStorage(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATION_SETTINGS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.jobs)) {
    writeStorage(STORAGE_KEYS.jobs, [] as QueueJob[]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.palettes)) {
    writeStorage(STORAGE_KEYS.palettes, [] as SavedPalette[]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.watchFolders)) {
    writeStorage(STORAGE_KEYS.watchFolders, [] as WatchFolder[]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.activeProfileId)) {
    localStorage.setItem(STORAGE_KEYS.activeProfileId, DEFAULT_PROFILE.id);
  }

  startWatchFolderPolling();
}

export function getPresets(type?: "image"): ImagePreset[];
export function getPresets(type?: "video"): VideoPreset[];
export function getPresets(type?: "seo"): SeoPreset[];
export function getPresets(type?: "image" | "video" | "seo"): WorkflowPreset[] {
  const presets = readStorage<WorkflowPreset[]>(STORAGE_KEYS.presets, []);
  return type ? presets.filter((preset) => preset.type === type) : presets;
}

export function savePreset(preset: WorkflowPreset) {
  const presets = readStorage<WorkflowPreset[]>(STORAGE_KEYS.presets, []);
  const index = presets.findIndex((item) => item.id === preset.id);
  if (index >= 0) {
    presets[index] = preset;
  } else {
    presets.unshift(preset);
  }

  writeStorage(STORAGE_KEYS.presets, presets);
  emitWorkflowChange("presets");
}

export function createPresetId(type: "image" | "video" | "seo") {
  return createId(`preset-${type}`);
}

export function deletePreset(presetId: string) {
  const presets = getPresets().filter((preset) => preset.id !== presetId);
  writeStorage(STORAGE_KEYS.presets, presets);
  emitWorkflowChange("presets");
}

export function getProfiles(): WorkflowProfile[] {
  return readStorage<WorkflowProfile[]>(STORAGE_KEYS.profiles, []);
}

export function saveProfile(profile: WorkflowProfile) {
  const profiles = getProfiles();
  const index = profiles.findIndex((item) => item.id === profile.id);
  if (index >= 0) {
    profiles[index] = profile;
  } else {
    profiles.unshift(profile);
  }

  writeStorage(STORAGE_KEYS.profiles, profiles);
  emitWorkflowChange("profiles");
}

export function createProfileId() {
  return createId("profile");
}

export function deleteProfile(profileId: string) {
  const profiles = getProfiles().filter((profile) => profile.id !== profileId);
  writeStorage(STORAGE_KEYS.profiles, profiles);

  if (getActiveProfileId() === profileId && profiles[0]) {
    setActiveProfileId(profiles[0].id);
  }

  emitWorkflowChange("profiles");
}

export function getActiveProfileId(): string {
  return localStorage.getItem(STORAGE_KEYS.activeProfileId) || DEFAULT_PROFILE.id;
}

export function setActiveProfileId(profileId: string) {
  localStorage.setItem(STORAGE_KEYS.activeProfileId, profileId);
  emitWorkflowChange("profiles");
}

export function getActiveProfile(): WorkflowProfile | null {
  const profiles = getProfiles();
  return profiles.find((profile) => profile.id === getActiveProfileId()) || profiles[0] || null;
}

export function getNotificationSettings(): NotificationSettings {
  return readStorage<NotificationSettings>(
    STORAGE_KEYS.notifications,
    DEFAULT_NOTIFICATION_SETTINGS,
  );
}

export function saveNotificationSettings(settings: NotificationSettings) {
  writeStorage(STORAGE_KEYS.notifications, settings);
  emitWorkflowChange("notifications");
}

export function getSavedPalettes(): SavedPalette[] {
  return readStorage<SavedPalette[]>(STORAGE_KEYS.palettes, []);
}

export function savePalette(palette: SavedPalette) {
  const palettes = getSavedPalettes();
  const index = palettes.findIndex((item) => item.id === palette.id);
  if (index >= 0) {
    palettes[index] = palette;
  } else {
    palettes.unshift(palette);
  }

  writeStorage(STORAGE_KEYS.palettes, palettes);
  emitWorkflowChange("palettes");
}

export function createPaletteId() {
  return createId("palette");
}

export function deletePalette(paletteId: string) {
  writeStorage(
    STORAGE_KEYS.palettes,
    getSavedPalettes().filter((palette) => palette.id !== paletteId),
  );
  emitWorkflowChange("palettes");
}

export function buildPaletteCssVariables(palette: SavedPalette): string {
  return palette.colors
    .map((color, index) => `--palette-${palette.name.toLowerCase().replace(/\s+/g, "-")}-${index + 1}: ${color};`)
    .join("\n");
}

export function getQueueJobs(): QueueJob[] {
  return readStorage<QueueJob[]>(STORAGE_KEYS.jobs, []);
}

function saveQueueJobs(jobs: QueueJob[]) {
  writeStorage(STORAGE_KEYS.jobs, jobs.slice(0, 60));
  emitWorkflowChange("jobs");
}

export function createQueueJob(
  input: Omit<
    QueueJob,
    "id" | "createdAt" | "updatedAt" | "status" | "outputPaths" | "retries"
  > & {
    status?: QueueJob["status"];
    outputPaths?: string[];
    retries?: number;
  },
): QueueJob {
  const job: QueueJob = {
    id: createId("job"),
    status: input.status || "queued",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    outputPaths: input.outputPaths || [],
    retries: input.retries || 0,
    ...input,
  };

  saveQueueJobs([job, ...getQueueJobs()]);
  return job;
}

export function updateQueueJob(jobId: string, patch: Partial<QueueJob>) {
  const jobs = getQueueJobs();
  const index = jobs.findIndex((job) => job.id === jobId);
  if (index === -1) {
    return;
  }

  jobs[index] = {
    ...jobs[index],
    ...patch,
    updatedAt: nowIso(),
  };

  saveQueueJobs(jobs);
}

export function completeQueueJob(
  jobId: string,
  patch: Partial<QueueJob> = {},
) {
  updateQueueJob(jobId, {
    status: "success",
    ...patch,
  });

  const settings = getNotificationSettings();
  if (settings.enabled && settings.queueSuccess) {
    const job = getQueueJobs().find((item) => item.id === jobId);
    if (job) {
      notifyApp("success", `${job.title} completed.`);
    }
  }
}

export function failQueueJob(jobId: string, message: string) {
  updateQueueJob(jobId, {
    status: "error",
    message,
  });

  const settings = getNotificationSettings();
  if (settings.enabled && settings.queueFailure) {
    const job = getQueueJobs().find((item) => item.id === jobId);
    if (job) {
      notifyApp("error", `${job.title} failed: ${message}`);
    }
  }
}

export function registerRetryHandler(
  retryKey: string,
  handler: (payload: unknown) => Promise<void>,
) {
  retryHandlers.set(retryKey, handler);
}

export async function retryQueueJob(jobId: string) {
  const job = getQueueJobs().find((item) => item.id === jobId);
  if (!job || !job.retryKey || !job.retryPayload) {
    return;
  }

  const handler = retryHandlers.get(job.retryKey);
  if (!handler) {
    throw new Error(`Retry handler not found for ${job.retryKey}`);
  }

  updateQueueJob(jobId, {
    status: "retrying",
    retries: job.retries + 1,
    message: "Retrying...",
  });

  const payload = JSON.parse(job.retryPayload) as unknown;
  await handler(payload);
}

export function createRetryPayload(payload: unknown): string {
  return JSON.stringify(payload);
}

export function getWatchFolders(): WatchFolder[] {
  return readStorage<WatchFolder[]>(STORAGE_KEYS.watchFolders, []);
}

function saveWatchFolders(folders: WatchFolder[]) {
  writeStorage(STORAGE_KEYS.watchFolders, folders);
  emitWorkflowChange("watchFolders");
}

export function createWatchFolderId() {
  return createId("watch");
}

export function saveWatchFolder(folder: WatchFolder) {
  const folders = getWatchFolders();
  const index = folders.findIndex((item) => item.id === folder.id);
  if (index >= 0) {
    folders[index] = folder;
  } else {
    folders.unshift(folder);
  }

  saveWatchFolders(folders);
}

export function deleteWatchFolder(folderId: string) {
  saveWatchFolders(getWatchFolders().filter((folder) => folder.id !== folderId));
}

export function registerWatchProcessor(
  tool: WatchFolderTool,
  handler: (paths: string[], folder: WatchFolder) => Promise<void>,
) {
  watchProcessors.set(tool, handler);
  startWatchFolderPolling();
}

function startWatchFolderPolling() {
  if (watchTimer !== null) {
    return;
  }

  watchTimer = window.setInterval(() => {
    void pollWatchFolders();
  }, 8000);
}

function filterPathsForTool(paths: string[], tool: WatchFolderTool) {
  if (tool === "image" || tool === "hex") {
    return paths.filter(isImagePath);
  }

  return paths.filter(isVideoPath);
}

async function listFolderFiles(folderPath: string): Promise<string[]> {
  const fs = await import("@tauri-apps/plugin-fs");
  const entries = await fs.readDir(folderPath);

  return entries
    .filter((entry) => !("isDirectory" in entry ? entry.isDirectory : Boolean((entry as { children?: unknown[] }).children)))
    .map((entry) => joinPath(folderPath, entry.name || ""))
    .filter(Boolean);
}

export async function pollWatchFolders() {
  if (watchPollInProgress) {
    return;
  }

  const folders = getWatchFolders().filter((folder) => folder.enabled);
  if (folders.length === 0) {
    return;
  }

  watchPollInProgress = true;

  try {
    for (const folder of folders) {
      const now = Date.now();
      const lastRun = folder.lastRunAt ? new Date(folder.lastRunAt).getTime() : 0;
      if (now - lastRun < folder.intervalMs) {
        continue;
      }

      try {
        const filePaths = filterPathsForTool(await listFolderFiles(folder.path), folder.tool);
        const freshPaths = filePaths.filter(
          (path) => !folder.processedPaths.includes(path),
        );

        if (freshPaths.length > 0) {
          const handler = watchProcessors.get(folder.tool);
          if (handler) {
            await handler(freshPaths, folder);
          }

          folder.processedPaths = [...folder.processedPaths, ...freshPaths].slice(-400);
          if (getNotificationSettings().watchFolderEvents) {
            notifyApp(
              "info",
              `${folder.name} processed ${freshPaths.length} new file(s).`,
            );
          }
        }
      } catch (error) {
        console.error(`Watch folder poll error for ${folder.name}:`, error);
      }

      folder.lastRunAt = nowIso();
      saveWatchFolder(folder);
    }
  } finally {
    watchPollInProgress = false;
  }
}
