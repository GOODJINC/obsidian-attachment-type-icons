import { MarkdownView, Plugin } from "obsidian";
import { AttachmentTypeIconsSettingTab, AttachmentTypeIconsSettings, DEFAULT_SETTINGS, FileTypeRule } from "./settings";

const ICON_CLASS = "attachment-type-icons-icon";

export default class AttachmentTypeIconsPlugin extends Plugin {
	settings: AttachmentTypeIconsSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new AttachmentTypeIconsSettingTab(this.app, this));
		this.registerMarkdownPostProcessor((element, context) => this.addIcons(element, context.sourcePath));
		this.app.workspace.onLayoutReady(() => this.refreshVisibleIcons());
	}

	async loadSettings(): Promise<void> {
		const saved = await this.loadData() as Partial<AttachmentTypeIconsSettings> | null;
		const sourceRules = saved?.rules ?? DEFAULT_SETTINGS.rules;
		this.settings = {
			...DEFAULT_SETTINGS,
			...saved,
			rules: sourceRules.map((rule) => ({
				...rule,
				extensions: [...(rule.extensions ?? [])],
				folders: [...(rule.folders ?? [])]
			}))
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshVisibleIcons();
	}

	private refreshVisibleIcons(): void {
		for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
			if (!(leaf.view instanceof MarkdownView)) continue;
			const { contentEl } = leaf.view;
			contentEl.querySelectorAll(`.${ICON_CLASS}`).forEach((icon) => icon.remove());
			this.addIcons(contentEl, leaf.view.file?.path ?? "");
		}
	}

	private addIcons(element: HTMLElement, sourcePath: string): void {
		for (const link of Array.from(element.querySelectorAll<HTMLAnchorElement>("a.internal-link:not(.internal-embed)"))) {
			if (link.closest(".internal-embed")) continue;
			if (link.querySelector(`.${ICON_CLASS}`)) continue;
			const target = link.dataset.href;
			if (!target) continue;

			const icon = this.iconForTarget(target, sourcePath);
			if (!icon) continue;

			const position = this.settings.iconPosition;
			const iconEl = link.createSpan({ cls: `${ICON_CLASS} is-${position}`, text: icon });
			if (position === "after") link.append(iconEl);
			else link.prepend(iconEl);
		}
	}

	private iconForTarget(target: string, sourcePath: string): string | null {
		const normalizedTarget = target.split("#", 1)[0].split("?", 1)[0];
		const resolvedFile = this.app.metadataCache.getFirstLinkpathDest(normalizedTarget, sourcePath);
		const extension = resolvedFile?.extension.toLowerCase() ?? normalizedTarget.match(/\.([^.\\/]+)$/)?.[1]?.toLowerCase();
		if (!extension || extension === "md") return this.settings.showNoteLinks ? this.settings.noteIcon : null;

		const rule = this.matchRule(extension, resolvedFile?.path ?? normalizedTarget);
		return rule?.icon || null;
	}

	private matchRule(extension: string, targetPath: string): FileTypeRule | undefined {
		const candidates = this.settings.rules.filter((rule) => rule.enabled && rule.extensions.some((candidate) => candidate.toLowerCase() === extension));
		return candidates.find((rule) => rule.folders.length > 0 && this.matchesFolder(targetPath, rule.folders))
			?? candidates.find((rule) => rule.folders.length === 0);
	}

	private matchesFolder(targetPath: string, folders: string[]): boolean {
		const normalizedPath = targetPath.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
		return folders.some((folder) => {
			const normalizedFolder = folder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").toLowerCase();
			return normalizedFolder.length > 0 && normalizedPath.startsWith(`${normalizedFolder}/`);
		});
	}

}
