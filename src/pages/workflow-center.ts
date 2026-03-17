import { escapeHtml } from "../utils/helpers";
import {
  createProfileId,
  createWatchFolderId,
  deletePalette,
  deletePreset,
  deleteProfile,
  deleteWatchFolder,
  getActiveProfile,
  getActiveProfileId,
  getNotificationSettings,
  getPresets,
  getProfiles,
  getQueueJobs,
  getSavedPalettes,
  getWatchFolders,
  notifyApp,
  requestWorkflowNotificationPermission,
  retryQueueJob,
  saveNotificationSettings,
  saveProfile,
  saveWatchFolder,
  setActiveProfileId,
  subscribeToasts,
  subscribeWorkflowChanges,
  buildPaletteCssVariables,
} from "../workflow";
import type { WatchFolder } from "../types";

let removeWorkflowSubscription: (() => void) | null = null;
let removeToastSubscription: (() => void) | null = null;

export function setupWorkflowCenterPage() {
  ensureWorkflowCenterUi();
  wireWorkflowCenterEvents();
  loadWorkflowCenter();

  if (!removeWorkflowSubscription) {
    removeWorkflowSubscription = subscribeWorkflowChanges(() => {
      loadWorkflowCenter();
    });
  }

  if (!removeToastSubscription) {
    removeToastSubscription = subscribeToasts(({ kind, message }) => {
      showToast(kind, message);
    });
  }
}

export function loadWorkflowCenter() {
  renderProfileSection();
  renderPresetSection();
  renderQueueSection();
  renderWatchFolderSection();
  renderNotificationSection();
  renderPaletteSection();
}

function ensureWorkflowCenterUi() {
  const contentWrapper = document.querySelector("#settingsPage .content-wrapper");
  const databaseContainer = document.querySelector("#settingsPage .database-container");
  if (!contentWrapper || !databaseContainer) {
    return;
  }

  if (!document.getElementById("workflowCenter")) {
    const workflowCenter = document.createElement("section");
    workflowCenter.id = "workflowCenter";
    workflowCenter.className = "workflow-center";
    workflowCenter.innerHTML = `
      <div class="workflow-center-header">
        <h3>Workflow Center</h3>
        <p>Profiles, presets, queue logs, watch folders and notifications live here.</p>
      </div>
      <div class="workflow-center-grid">
        <article class="workflow-card" id="workflowProfilesCard">
          <div class="workflow-card-header">
            <h4>Profiles</h4>
          </div>
          <div class="workflow-card-body">
            <div id="workflowProfilesContent"></div>
          </div>
        </article>
        <article class="workflow-card" id="workflowPresetsCard">
          <div class="workflow-card-header">
            <h4>Preset Library</h4>
          </div>
          <div class="workflow-card-body">
            <div id="workflowPresetsContent"></div>
          </div>
        </article>
        <article class="workflow-card" id="workflowQueueCard">
          <div class="workflow-card-header">
            <h4>Queue & Logs</h4>
          </div>
          <div class="workflow-card-body">
            <div id="workflowQueueContent"></div>
          </div>
        </article>
        <article class="workflow-card" id="workflowWatchCard">
          <div class="workflow-card-header">
            <h4>Watch Folders</h4>
          </div>
          <div class="workflow-card-body">
            <div id="workflowWatchContent"></div>
          </div>
        </article>
        <article class="workflow-card" id="workflowNotificationsCard">
          <div class="workflow-card-header">
            <h4>Notifications</h4>
          </div>
          <div class="workflow-card-body">
            <div id="workflowNotificationsContent"></div>
          </div>
        </article>
        <article class="workflow-card" id="workflowPalettesCard">
          <div class="workflow-card-header">
            <h4>Saved Palettes</h4>
          </div>
          <div class="workflow-card-body">
            <div id="workflowPalettesContent"></div>
          </div>
        </article>
      </div>
    `;

    contentWrapper.appendChild(workflowCenter);
  }

  if (!document.getElementById("toastStack")) {
    const toastStack = document.createElement("div");
    toastStack.id = "toastStack";
    toastStack.className = "toast-stack";
    document.body.appendChild(toastStack);
  }
}

function wireWorkflowCenterEvents() {
  const workflowCenter = document.getElementById("workflowCenter");
  if (!workflowCenter || workflowCenter.dataset.bound === "true") {
    return;
  }

  workflowCenter.dataset.bound = "true";

  workflowCenter.addEventListener("click", async (event) => {
    const retryButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-retry-job]");
    if (retryButton?.dataset.retryJob) {
      try {
        await retryQueueJob(retryButton.dataset.retryJob);
      } catch (error) {
        notifyApp("error", `Retry failed: ${String(error)}`);
      }
      return;
    }

    const deletePaletteButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-delete-palette]");
    if (deletePaletteButton?.dataset.deletePalette) {
      deletePalette(deletePaletteButton.dataset.deletePalette);
      return;
    }

    const copyPaletteButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-copy-palette-css]");
    if (copyPaletteButton?.dataset.copyPaletteCss) {
      const palette = getSavedPalettes().find((item) => item.id === copyPaletteButton.dataset.copyPaletteCss);
      if (palette) {
        await navigator.clipboard.writeText(buildPaletteCssVariables(palette));
        notifyApp("success", `Copied CSS variables for ${palette.name}`);
      }
      return;
    }

    const deleteWatchButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-delete-watch]");
    if (deleteWatchButton?.dataset.deleteWatch) {
      deleteWatchFolder(deleteWatchButton.dataset.deleteWatch);
      return;
    }

    const deletePresetButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-delete-preset]");
    if (deletePresetButton?.dataset.deletePreset) {
      deletePreset(deletePresetButton.dataset.deletePreset);
      return;
    }

    const deleteProfileButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-delete-profile]");
    if (deleteProfileButton?.dataset.deleteProfile) {
      deleteProfile(deleteProfileButton.dataset.deleteProfile);
      return;
    }

    const saveProfileButton = (event.target as HTMLElement).closest<HTMLButtonElement>("#saveWorkflowProfileBtn");
    if (saveProfileButton) {
      saveProfileFromForm();
      return;
    }

    const pickWatchFolderButton = (event.target as HTMLElement).closest<HTMLButtonElement>("#pickWatchFolderBtn");
    if (pickWatchFolderButton) {
      await pickWatchFolderPath();
      return;
    }

    const saveWatchFolderButton = (event.target as HTMLElement).closest<HTMLButtonElement>("#saveWatchFolderBtn");
    if (saveWatchFolderButton) {
      saveWatchFolderFromForm();
      return;
    }

    const saveNotificationButton = (event.target as HTMLElement).closest<HTMLButtonElement>("#saveNotificationSettingsBtn");
    if (saveNotificationButton) {
      saveNotificationsFromForm();
      return;
    }

    const permissionButton = (event.target as HTMLElement).closest<HTMLButtonElement>("#requestNotificationPermissionBtn");
    if (permissionButton) {
      const permission = await requestWorkflowNotificationPermission();
      notifyApp("info", `Notification permission: ${permission}`);
      return;
    }
  });

  workflowCenter.addEventListener("change", (event) => {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLSelectElement && target.id === "activeWorkflowProfileSelect") {
      setActiveProfileId(target.value);
    }
  });
}

function renderProfileSection() {
  const container = document.getElementById("workflowProfilesContent");
  if (!container) {
    return;
  }

  const profiles = getProfiles();
  const presets = {
    image: getPresets("image"),
    video: getPresets("video"),
    seo: getPresets("seo"),
  };
  const activeProfile = getActiveProfile();

  container.innerHTML = `
    <div class="workflow-form-grid">
      <label>
        <span>Active profile</span>
        <select id="activeWorkflowProfileSelect" class="tool-select">
          ${profiles
            .map(
              (profile) => `
                <option value="${profile.id}" ${profile.id === getActiveProfileId() ? "selected" : ""}>
                  ${escapeHtml(profile.name)}
                </option>
              `,
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Profile name</span>
        <input id="workflowProfileName" class="monitor-input" type="text" value="${escapeHtml(activeProfile?.name || "")}">
      </label>
      <label>
        <span>Image preset</span>
        <select id="workflowProfileImagePreset" class="tool-select">
          ${presets.image
            .map(
              (preset) => `
                <option value="${preset.id}" ${preset.id === activeProfile?.imagePresetId ? "selected" : ""}>
                  ${escapeHtml(preset.name)}
                </option>
              `,
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Video preset</span>
        <select id="workflowProfileVideoPreset" class="tool-select">
          ${presets.video
            .map(
              (preset) => `
                <option value="${preset.id}" ${preset.id === activeProfile?.videoPresetId ? "selected" : ""}>
                  ${escapeHtml(preset.name)}
                </option>
              `,
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>SEO preset</span>
        <select id="workflowProfileSeoPreset" class="tool-select">
          ${presets.seo
            .map(
              (preset) => `
                <option value="${preset.id}" ${preset.id === activeProfile?.seoPresetId ? "selected" : ""}>
                  ${escapeHtml(preset.name)}
                </option>
              `,
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Watermark / brand text</span>
        <input id="workflowProfileWatermark" class="monitor-input" type="text" value="${escapeHtml(activeProfile?.watermarkText || "")}">
      </label>
      <label class="workflow-form-wide">
        <span>Notes</span>
        <textarea id="workflowProfileNotes" class="seo-textarea">${escapeHtml(activeProfile?.notes || "")}</textarea>
      </label>
    </div>
    <div class="workflow-inline-actions">
      <button class="btn-primary btn-sm" id="saveWorkflowProfileBtn" type="button">Save Profile</button>
      ${profiles.length > 1 ? `<button class="btn-danger btn-sm" data-delete-profile="${activeProfile?.id || ""}" type="button">Delete Active</button>` : ""}
    </div>
  `;
}

function renderPresetSection() {
  const container = document.getElementById("workflowPresetsContent");
  if (!container) {
    return;
  }

  const groups = [
    { title: "Image presets", presets: getPresets("image") },
    { title: "Video presets", presets: getPresets("video") },
    { title: "SEO presets", presets: getPresets("seo") },
  ];

  container.innerHTML = groups
    .map(
      (group) => `
        <div class="workflow-list-block">
          <h5>${group.title}</h5>
          <div class="workflow-chip-list">
            ${group.presets
              .map(
                (preset) => `
                  <div class="workflow-chip">
                    <span>${escapeHtml(preset.name)}</span>
                    <button class="btn-danger btn-xs" type="button" data-delete-preset="${preset.id}">Delete</button>
                  </div>
                `,
              )
              .join("")}
          </div>
        </div>
      `,
    )
    .join("");
}

function renderQueueSection() {
  const container = document.getElementById("workflowQueueContent");
  if (!container) {
    return;
  }

  const jobs = getQueueJobs();
  if (jobs.length === 0) {
    container.innerHTML = `<p class="empty-message">No jobs yet.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="workflow-log-list">
      ${jobs
        .map(
          (job) => `
            <div class="workflow-log-item status-${job.status}">
              <div class="workflow-log-main">
                <strong>${escapeHtml(job.title)}</strong>
                <span>${escapeHtml(job.message)}</span>
              </div>
              <div class="workflow-log-meta">
                <span>${escapeHtml(job.status)}</span>
                <small>${escapeHtml(new Date(job.updatedAt).toLocaleString())}</small>
              </div>
              ${job.metrics ? `<div class="workflow-log-metrics">${Object.entries(job.metrics).map(([key, value]) => `<span>${escapeHtml(key)}: ${escapeHtml(String(value))}</span>`).join("")}</div>` : ""}
              ${job.status === "error" && job.retryKey ? `<button class="btn-secondary btn-sm" type="button" data-retry-job="${job.id}">Retry</button>` : ""}
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderWatchFolderSection() {
  const container = document.getElementById("workflowWatchContent");
  if (!container) {
    return;
  }

  const watchFolders = getWatchFolders();
  const presets = [...getPresets("image"), ...getPresets("video")];

  container.innerHTML = `
    <div class="workflow-form-grid">
      <label>
        <span>Name</span>
        <input id="watchFolderName" class="monitor-input" type="text" placeholder="Assets inbox">
      </label>
      <label class="workflow-form-wide">
        <span>Folder</span>
        <div class="workflow-inline-actions">
          <input id="watchFolderPath" class="monitor-input" type="text" placeholder="Pick a folder" readonly>
          <button class="btn-secondary btn-sm" id="pickWatchFolderBtn" type="button">Pick</button>
        </div>
      </label>
      <label>
        <span>Tool</span>
        <select id="watchFolderTool" class="tool-select">
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="hex">Hex</option>
        </select>
      </label>
      <label>
        <span>Behavior</span>
        <select id="watchFolderBehavior" class="tool-select">
          <option value="process">Process automatically</option>
          <option value="import">Only import</option>
        </select>
      </label>
      <label>
        <span>Preset</span>
        <select id="watchFolderPreset" class="tool-select">
          <option value="">Use active profile default</option>
          ${presets.map((preset) => `<option value="${preset.id}">${escapeHtml(preset.name)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Interval ms</span>
        <input id="watchFolderInterval" class="monitor-input" type="number" min="2000" step="1000" value="8000">
      </label>
    </div>
    <div class="workflow-inline-actions">
      <button class="btn-primary btn-sm" id="saveWatchFolderBtn" type="button">Add Watch Folder</button>
    </div>
    <div class="workflow-list-block">
      <h5>Active folders</h5>
      <div class="workflow-log-list">
        ${
          watchFolders.length === 0
            ? '<p class="empty-message">No watch folders configured.</p>'
            : watchFolders
                .map(
                  (folder) => `
                    <div class="workflow-log-item">
                      <div class="workflow-log-main">
                        <strong>${escapeHtml(folder.name)}</strong>
                        <span>${escapeHtml(folder.path)}</span>
                      </div>
                      <div class="workflow-log-meta">
                        <span>${escapeHtml(folder.tool)} / ${escapeHtml(folder.behavior)}</span>
                        <small>${escapeHtml(folder.enabled ? "enabled" : "disabled")}</small>
                      </div>
                      <button class="btn-danger btn-sm" type="button" data-delete-watch="${folder.id}">Delete</button>
                    </div>
                  `,
                )
                .join("")
        }
      </div>
    </div>
  `;
}

function renderNotificationSection() {
  const container = document.getElementById("workflowNotificationsContent");
  if (!container) {
    return;
  }

  const settings = getNotificationSettings();
  container.innerHTML = `
    <div class="workflow-form-grid">
      <label class="checkbox-inline">
        <input id="workflowNotificationsEnabled" type="checkbox" ${settings.enabled ? "checked" : ""}>
        <span>Enable notifications</span>
      </label>
      <label class="checkbox-inline">
        <input id="workflowQueueSuccess" type="checkbox" ${settings.queueSuccess ? "checked" : ""}>
        <span>Queue success toasts</span>
      </label>
      <label class="checkbox-inline">
        <input id="workflowQueueFailure" type="checkbox" ${settings.queueFailure ? "checked" : ""}>
        <span>Queue failure toasts</span>
      </label>
      <label class="checkbox-inline">
        <input id="workflowWatchEvents" type="checkbox" ${settings.watchFolderEvents ? "checked" : ""}>
        <span>Watch folder toasts</span>
      </label>
      <label>
        <span>SSL threshold days</span>
        <input id="workflowSslThreshold" class="monitor-input" type="number" min="1" value="${settings.sslThresholdDays}">
      </label>
      <label>
        <span>Domain threshold days</span>
        <input id="workflowDomainThreshold" class="monitor-input" type="number" min="1" value="${settings.domainThresholdDays}">
      </label>
    </div>
    <div class="workflow-inline-actions">
      <button class="btn-primary btn-sm" id="saveNotificationSettingsBtn" type="button">Save Notifications</button>
      <button class="btn-secondary btn-sm" id="requestNotificationPermissionBtn" type="button">Request Permission</button>
    </div>
  `;
}

function renderPaletteSection() {
  const container = document.getElementById("workflowPalettesContent");
  if (!container) {
    return;
  }

  const palettes = getSavedPalettes();
  if (palettes.length === 0) {
    container.innerHTML = `<p class="empty-message">No saved palettes yet.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="workflow-log-list">
      ${palettes
        .map(
          (palette) => `
            <div class="workflow-log-item">
              <div class="workflow-log-main">
                <strong>${escapeHtml(palette.name)}</strong>
                <span>${escapeHtml(palette.baseHex)}</span>
              </div>
              <div class="workflow-swatch-row">
                ${palette.colors.map((color) => `<span class="workflow-swatch" style="background:${color}"></span>`).join("")}
              </div>
              <div class="workflow-inline-actions">
                <button class="btn-secondary btn-sm" type="button" data-copy-palette-css="${palette.id}">Copy CSS</button>
                <button class="btn-danger btn-sm" type="button" data-delete-palette="${palette.id}">Delete</button>
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function saveProfileFromForm() {
  const activeProfile = getActiveProfile();
  const profileName = (document.getElementById("workflowProfileName") as HTMLInputElement | null)?.value.trim();
  const imagePresetId = (document.getElementById("workflowProfileImagePreset") as HTMLSelectElement | null)?.value || "";
  const videoPresetId = (document.getElementById("workflowProfileVideoPreset") as HTMLSelectElement | null)?.value || "";
  const seoPresetId = (document.getElementById("workflowProfileSeoPreset") as HTMLSelectElement | null)?.value || "";
  const watermarkText = (document.getElementById("workflowProfileWatermark") as HTMLInputElement | null)?.value.trim() || "";
  const notes = (document.getElementById("workflowProfileNotes") as HTMLTextAreaElement | null)?.value.trim() || "";

  if (!profileName) {
    notifyApp("warning", "Profile name is required.");
    return;
  }

  saveProfile({
    id: activeProfile?.id || createProfileId(),
    name: profileName,
    imagePresetId,
    videoPresetId,
    seoPresetId,
    watermarkText,
    notes,
  });

  notifyApp("success", `Profile saved: ${profileName}`);
}

async function pickWatchFolderPath() {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Select watch folder",
  });

  if (selected && typeof selected === "string") {
    const pathInput = document.getElementById("watchFolderPath") as HTMLInputElement | null;
    if (pathInput) {
      pathInput.value = selected;
    }
  }
}

function saveWatchFolderFromForm() {
  const name = (document.getElementById("watchFolderName") as HTMLInputElement | null)?.value.trim();
  const path = (document.getElementById("watchFolderPath") as HTMLInputElement | null)?.value.trim();
  const tool = (document.getElementById("watchFolderTool") as HTMLSelectElement | null)?.value as WatchFolder["tool"];
  const behavior = (document.getElementById("watchFolderBehavior") as HTMLSelectElement | null)?.value as WatchFolder["behavior"];
  const presetId = (document.getElementById("watchFolderPreset") as HTMLSelectElement | null)?.value || "";
  const intervalMs = Number.parseInt((document.getElementById("watchFolderInterval") as HTMLInputElement | null)?.value || "8000", 10);

  if (!name || !path) {
    notifyApp("warning", "Watch folder name and path are required.");
    return;
  }

  saveWatchFolder({
    id: createWatchFolderId(),
    name,
    path,
    tool,
    behavior,
    presetId,
    enabled: true,
    intervalMs,
    processedPaths: [],
    lastRunAt: "",
  });

  notifyApp("success", `Watch folder saved: ${name}`);
}

function saveNotificationsFromForm() {
  saveNotificationSettings({
    enabled: Boolean((document.getElementById("workflowNotificationsEnabled") as HTMLInputElement | null)?.checked),
    queueSuccess: Boolean((document.getElementById("workflowQueueSuccess") as HTMLInputElement | null)?.checked),
    queueFailure: Boolean((document.getElementById("workflowQueueFailure") as HTMLInputElement | null)?.checked),
    watchFolderEvents: Boolean((document.getElementById("workflowWatchEvents") as HTMLInputElement | null)?.checked),
    sslThresholdDays: Number.parseInt((document.getElementById("workflowSslThreshold") as HTMLInputElement | null)?.value || "14", 10),
    domainThresholdDays: Number.parseInt((document.getElementById("workflowDomainThreshold") as HTMLInputElement | null)?.value || "30", 10),
  });

  notifyApp("success", "Notification settings saved.");
}

function showToast(kind: string, message: string) {
  const toastStack = document.getElementById("toastStack");
  if (!toastStack) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `app-toast app-toast-${kind}`;
  toast.textContent = message;
  toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-visible");
  }, 10);

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 250);
  }, 3200);
}
