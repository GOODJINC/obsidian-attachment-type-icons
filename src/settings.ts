import { App, PluginSettingTab, Setting, TextComponent } from "obsidian";
import type AttachmentTypeIconsPlugin from "./main";

export interface FileTypeRule {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	icon: string;
	extensions: string[];
}

export interface AttachmentTypeIconsSettings {
	rules: FileTypeRule[];
	showNoteLinks: boolean;
	noteIcon: string;
}

export const DEFAULT_SETTINGS: AttachmentTypeIconsSettings = {
	rules: [
		{ id: "images", name: "Images", description: "Image attachments", enabled: true, icon: "🖼️", extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg", "heic"] },
		{ id: "documents", name: "PDF & documents", description: "Documents and text files", enabled: true, icon: "📄", extensions: ["pdf", "doc", "docx", "hwp", "txt", "rtf"] },
		{ id: "spreadsheets", name: "Spreadsheets", description: "Spreadsheet and CSV files", enabled: true, icon: "📊", extensions: ["xlsx", "xls", "csv", "ods"] },
		{ id: "audio", name: "Audio", description: "Audio attachments", enabled: true, icon: "🔊", extensions: ["mp3", "m4a", "wav", "ogg", "flac"] },
		{ id: "video", name: "Video", description: "Video attachments", enabled: true, icon: "🎬", extensions: ["mp4", "mov", "webm", "mkv"] },
		{ id: "archives", name: "Archives", description: "Compressed files", enabled: true, icon: "📦", extensions: ["zip", "7z", "rar", "tar", "gz"] }
	],
	showNoteLinks: false,
	noteIcon: "📝"
};

export function normalizeExtensions(value: string): string[] {
	return [...new Set(value.split(",").map((extension) => extension.trim().replace(/^\.+/, "").toLowerCase()).filter(Boolean))];
}

export class AttachmentTypeIconsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: AttachmentTypeIconsPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl).setName("Attachment Type Icons").setHeading();
		containerEl.createEl("p", { text: "Shows icons for regular attachment links. Embedded files and previews are left unchanged." });

		for (const rule of this.plugin.settings.rules) {
			const setting = new Setting(containerEl)
				.setName(rule.name)
				.setDesc(rule.description)
				.addToggle((toggle) => toggle.setValue(rule.enabled).onChange(async (value) => {
					rule.enabled = value;
					await this.plugin.saveSettings();
				}));

			setting.controlEl.addClass("attachment-type-icons-rule-fields");
			this.addTextField(setting, "Icon", rule.icon, async (value) => {
				rule.icon = value.trim();
				await this.plugin.saveSettings();
			});
			this.addTextField(setting, "Extensions", rule.extensions.join(", "), async (value) => {
				rule.extensions = normalizeExtensions(value);
				await this.plugin.saveSettings();
			});
		}

		new Setting(containerEl)
			.setName("Note links")
			.setDesc("Optionally show an icon for links to Markdown notes.")
			.addToggle((toggle) => toggle.setValue(this.plugin.settings.showNoteLinks).onChange(async (value) => {
				this.plugin.settings.showNoteLinks = value;
				await this.plugin.saveSettings();
			}))
			.addText((text) => text.setPlaceholder("📝").setValue(this.plugin.settings.noteIcon).onChange(async (value) => {
				this.plugin.settings.noteIcon = value.trim();
				await this.plugin.saveSettings();
			}));
	}

	private addTextField(setting: Setting, label: string, value: string, onChange: (value: string) => Promise<void>): void {
		const field = setting.controlEl.createDiv({ cls: "attachment-type-icons-field" });
		field.createEl("label", { text: label });
		const input = new TextComponent(field);
		input.setValue(value).onChange(onChange);
	}
}
