import { MarkdownView, Plugin } from "obsidian";
import { AttachmentTypeIconsSettingTab, AttachmentTypeIconsSettings, DEFAULT_SETTINGS, FileTypeRule } from "./settings";

const ICON_CLASS = "attachment-type-icons-icon";

export default class AttachmentTypeIconsPlugin extends Plugin {
	settings: AttachmentTypeIconsSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new AttachmentTypeIconsSettingTab(this.app, this));
		this.registerMarkdownPostProcessor((element) => this.addIcons(element));
		this.app.workspace.onLayoutReady(() => this.refreshVisibleIcons());
	}

	async loadSettings(): Promise<void> {
		const saved = await this.loadData() as Partial<AttachmentTypeIconsSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...saved,
			rules: saved?.rules ?? DEFAULT_SETTINGS.rules.map((rule) => ({ ...rule, extensions: [...rule.extensions] }))
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
			this.addIcons(contentEl);
		}
	}

	private addIcons(element: HTMLElement): void {
		for (const link of Array.from(element.querySelectorAll<HTMLAnchorElement>("a.internal-link:not(.internal-embed)"))) {
			if (link.closest(".internal-embed")) continue;
			if (link.querySelector(`.${ICON_CLASS}`)) continue;
			const target = link.dataset.href;
			if (!target) continue;

			const icon = this.iconForTarget(target);
			if (!icon) continue;

			const iconEl = link.createSpan({ cls: ICON_CLASS, text: `${icon} ` });
			link.prepend(iconEl);
		}
	}

	private iconForTarget(target: string): string | null {
		const normalizedTarget = target.split("#", 1)[0].split("?", 1)[0];
		const extension = normalizedTarget.match(/\.([^.\\/]+)$/)?.[1]?.toLowerCase();
		if (!extension || extension === "md") return this.settings.showNoteLinks ? this.settings.noteIcon : null;

		const rule = this.matchRule(extension);
		return rule?.enabled ? rule.icon : null;
	}

	private matchRule(extension: string): FileTypeRule | undefined {
		return this.settings.rules.find((rule) => rule.extensions.some((candidate) => candidate.toLowerCase() === extension));
	}

}
