import { AbstractInputSuggest, App, getLanguage, PluginSettingTab, Setting, TextComponent } from "obsidian";
import type AttachmentTypeIconsPlugin from "./main";

const STRINGS = {
	en: {
		display: "Display",
		iconPosition: "Icon position",
		iconPositionDesc: "Show icons before or after the attachment link text.",
		before: "Before link text",
		after: "After link text",
		fileTypes: "File types",
		priorityHelp: "Folder-specific types take priority over types that match every folder. Within each group, the first matching type in this list is used.",
		unnamedType: "Unnamed file type",
		moveUp: "Move up",
		moveDown: "Move down",
		deleteType: "Delete file type",
		name: "Name",
		icon: "Icon",
		extensions: "Extensions",
		folders: "Folders (optional)",
		folderPlaceholder: "Any folder — type to browse vault folders",
		addType: "Add file type",
		addTypeDesc: "Create a custom type with its own name, icon, extensions, and optional folders.",
		newType: "New file type",
		customType: "Custom file type",
		noteLinks: "Note links",
		noteLinksDesc: "Optionally show an icon for links to Markdown notes."
	},
	ko: {
		display: "표시",
		iconPosition: "아이콘 위치",
		iconPositionDesc: "첨부파일 링크 텍스트의 앞이나 뒤에 아이콘을 표시합니다.",
		before: "링크 텍스트 앞",
		after: "링크 텍스트 뒤",
		fileTypes: "파일 유형",
		priorityHelp: "폴더가 지정된 유형은 모든 폴더에 적용되는 유형보다 우선합니다. 각 그룹에서는 이 목록에서 먼저 일치하는 유형이 적용됩니다.",
		unnamedType: "이름 없는 파일 유형",
		moveUp: "위로 이동",
		moveDown: "아래로 이동",
		deleteType: "파일 유형 삭제",
		name: "이름",
		icon: "아이콘",
		extensions: "확장자",
		folders: "폴더(선택 사항)",
		folderPlaceholder: "모든 폴더 — 입력하여 보관함 폴더 찾기",
		addType: "파일 유형 추가",
		addTypeDesc: "이름, 아이콘, 확장자와 선택적 폴더 조건을 가진 사용자 유형을 만듭니다.",
		newType: "새 파일 유형",
		customType: "사용자 파일 유형",
		noteLinks: "노트 링크",
		noteLinksDesc: "Markdown 노트 링크에도 선택적으로 아이콘을 표시합니다."
	}
} as const;

type Locale = keyof typeof STRINGS;
type TranslationKey = keyof typeof STRINGS.en;

const BUILT_IN_TEXT: Record<string, Record<Locale, { name: string; description: string }>> = {
	images: { en: { name: "Images", description: "Image attachments" }, ko: { name: "이미지", description: "이미지 첨부파일" } },
	documents: { en: { name: "PDF & documents", description: "Documents and text files" }, ko: { name: "PDF 및 문서", description: "문서와 텍스트 파일" } },
	spreadsheets: { en: { name: "Spreadsheets", description: "Spreadsheet and CSV files" }, ko: { name: "스프레드시트", description: "스프레드시트와 CSV 파일" } },
	audio: { en: { name: "Audio", description: "Audio attachments" }, ko: { name: "오디오", description: "오디오 첨부파일" } },
	video: { en: { name: "Video", description: "Video attachments" }, ko: { name: "비디오", description: "비디오 첨부파일" } },
	archives: { en: { name: "Archives", description: "Compressed files" }, ko: { name: "압축 파일", description: "압축된 파일" } }
};

export interface FileTypeRule {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	icon: string;
	extensions: string[];
	folders: string[];
	custom?: boolean;
}

export type IconPosition = "before" | "after";

export interface AttachmentTypeIconsSettings {
	rules: FileTypeRule[];
	showNoteLinks: boolean;
	noteIcon: string;
	iconPosition: IconPosition;
}

export const DEFAULT_SETTINGS: AttachmentTypeIconsSettings = {
	rules: [
		{ id: "images", name: "Images", description: "Image attachments", enabled: true, icon: "🖼️", extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg", "heic"], folders: [] },
		{ id: "documents", name: "PDF & documents", description: "Documents and text files", enabled: true, icon: "📄", extensions: ["pdf", "doc", "docx", "hwp", "txt", "rtf"], folders: [] },
		{ id: "spreadsheets", name: "Spreadsheets", description: "Spreadsheet and CSV files", enabled: true, icon: "📊", extensions: ["xlsx", "xls", "csv", "ods"], folders: [] },
		{ id: "audio", name: "Audio", description: "Audio attachments", enabled: true, icon: "🔊", extensions: ["mp3", "m4a", "wav", "ogg", "flac"], folders: [] },
		{ id: "video", name: "Video", description: "Video attachments", enabled: true, icon: "🎬", extensions: ["mp4", "mov", "webm", "mkv"], folders: [] },
		{ id: "archives", name: "Archives", description: "Compressed files", enabled: true, icon: "📦", extensions: ["zip", "7z", "rar", "tar", "gz"], folders: [] }
	],
	showNoteLinks: false,
	noteIcon: "📝",
	iconPosition: "before"
};

export function normalizeExtensions(value: string): string[] {
	return [...new Set(value.split(",").map((extension) => extension.trim().replace(/^\.+/, "").toLowerCase()).filter(Boolean))];
}

export function normalizeFolders(value: string): string[] {
	return [...new Set(value.split(",").map((folder) => folder.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "")).filter(Boolean))];
}

class FolderSuggest extends AbstractInputSuggest<string> {
	constructor(app: App, private inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.limit = 50;
	}

	protected getSuggestions(value: string): string[] {
		const query = value.split(",").pop()?.trim().replace(/\\/g, "/").toLowerCase() ?? "";
		const selected = new Set(normalizeFolders(value).map((folder) => folder.toLowerCase()));
		return this.app.vault.getAllFolders(false)
			.map((folder) => folder.path)
			.filter((path) => !selected.has(path.toLowerCase()) && path.toLowerCase().includes(query))
			.sort((a, b) => a.localeCompare(b));
	}

	renderSuggestion(value: string, el: HTMLElement): void {
		el.setText(value);
	}

	selectSuggestion(value: string): void {
		const parts = this.inputEl.value.split(",");
		parts[parts.length - 1] = ` ${value}`;
		const nextValue = parts.map((part) => part.trim()).filter(Boolean).join(", ");
		this.setValue(nextValue);
		this.inputEl.dispatchEvent(new Event("input"));
		this.close();
	}
}

export class AttachmentTypeIconsSettingTab extends PluginSettingTab {
	private locale: Locale = "en";

	constructor(app: App, private plugin: AttachmentTypeIconsPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.locale = getLanguage().toLowerCase().startsWith("ko") ? "ko" : "en";

		new Setting(containerEl).setName(this.t("display")).setHeading();
		new Setting(containerEl)
			.setName(this.t("iconPosition"))
			.setDesc(this.t("iconPositionDesc"))
			.addDropdown((dropdown) => dropdown
				.addOption("before", this.t("before"))
				.addOption("after", this.t("after"))
				.setValue(this.plugin.settings.iconPosition)
				.onChange(async (value) => {
					this.plugin.settings.iconPosition = value as IconPosition;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl).setName(this.t("fileTypes")).setHeading();
		containerEl.createEl("p", { text: this.t("priorityHelp") });

		for (const [index, rule] of this.plugin.settings.rules.entries()) {
			const displayName = this.localizedRuleName(rule);
			const setting = new Setting(containerEl)
				.setName(displayName || this.t("unnamedType"))
				.setDesc(this.localizedRuleDescription(rule))
				.addToggle((toggle) => toggle.setValue(rule.enabled).onChange(async (value) => {
					rule.enabled = value;
					await this.plugin.saveSettings();
				}));

			setting.addExtraButton((button) => button
				.setIcon("arrow-up")
				.setTooltip(this.t("moveUp"))
				.setDisabled(index === 0)
				.onClick(async () => this.moveRule(index, -1)));
			setting.addExtraButton((button) => button
				.setIcon("arrow-down")
				.setTooltip(this.t("moveDown"))
				.setDisabled(index === this.plugin.settings.rules.length - 1)
				.onClick(async () => this.moveRule(index, 1)));

			if (rule.custom) {
				setting.addExtraButton((button) => button
					.setIcon("trash-2")
					.setTooltip(this.t("deleteType"))
					.onClick(async () => {
						this.plugin.settings.rules = this.plugin.settings.rules.filter((candidate) => candidate.id !== rule.id);
						await this.plugin.saveSettings();
						this.display();
					}));
			}

			setting.controlEl.addClass("attachment-type-icons-rule-fields");
			this.addTextField(setting, this.t("name"), displayName, "Ebooks", async (value) => {
				rule.name = value.trim();
				setting.setName(rule.name || this.t("unnamedType"));
				await this.plugin.saveSettings();
			}, "is-name");
			this.addTextField(setting, this.t("icon"), rule.icon, "📚", async (value) => {
				rule.icon = value.trim();
				await this.plugin.saveSettings();
			}, "is-icon");
			this.addTextField(setting, this.t("extensions"), rule.extensions.join(", "), "epub, mobi, pdf", async (value) => {
				rule.extensions = normalizeExtensions(value);
				await this.plugin.saveSettings();
			}, "is-extensions");
			this.addFolderField(setting, rule);
		}

		new Setting(containerEl)
			.setName(this.t("addType"))
			.setDesc(this.t("addTypeDesc"))
			.addButton((button) => button
				.setButtonText(this.t("addType"))
				.setCta()
				.onClick(async () => {
					this.plugin.settings.rules.push({
						id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
						name: this.t("newType"),
						description: this.t("customType"),
						enabled: true,
						icon: "📎",
						extensions: [],
						folders: [],
						custom: true
					});
					await this.plugin.saveSettings();
					this.display();
				}));

		new Setting(containerEl)
			.setName(this.t("noteLinks"))
			.setDesc(this.t("noteLinksDesc"))
			.addToggle((toggle) => toggle.setValue(this.plugin.settings.showNoteLinks).onChange(async (value) => {
				this.plugin.settings.showNoteLinks = value;
				await this.plugin.saveSettings();
			}))
			.addText((text) => text.setPlaceholder("📝").setValue(this.plugin.settings.noteIcon).onChange(async (value) => {
				this.plugin.settings.noteIcon = value.trim();
				await this.plugin.saveSettings();
			}));
	}

	private addTextField(setting: Setting, label: string, value: string, placeholder: string, onChange: (value: string) => Promise<void>, className: string): void {
		const field = setting.controlEl.createDiv({ cls: `attachment-type-icons-field ${className}` });
		field.createEl("label", { text: label });
		const input = new TextComponent(field);
		input.setPlaceholder(placeholder).setValue(value).onChange(onChange);
	}

	private addFolderField(setting: Setting, rule: FileTypeRule): void {
		const field = setting.controlEl.createDiv({ cls: "attachment-type-icons-field is-folders" });
		field.createEl("label", { text: this.t("folders") });
		const input = new TextComponent(field)
			.setPlaceholder(this.t("folderPlaceholder"))
			.setValue(rule.folders.join(", "))
			.onChange(async (value) => {
				rule.folders = normalizeFolders(value);
				await this.plugin.saveSettings();
			});
		new FolderSuggest(this.app, input.inputEl);
	}

	private async moveRule(index: number, direction: -1 | 1): Promise<void> {
		const destination = index + direction;
		if (destination < 0 || destination >= this.plugin.settings.rules.length) return;
		const rules = this.plugin.settings.rules;
		[rules[index], rules[destination]] = [rules[destination], rules[index]];
		await this.plugin.saveSettings();
		this.display();
	}

	private localizedRuleName(rule: FileTypeRule): string {
		const builtIn = BUILT_IN_TEXT[rule.id];
		if (builtIn && (rule.name === builtIn.en.name || rule.name === builtIn.ko.name)) return builtIn[this.locale].name;
		if (rule.custom && (rule.name === STRINGS.en.newType || rule.name === STRINGS.ko.newType)) return this.t("newType");
		return rule.name;
	}

	private localizedRuleDescription(rule: FileTypeRule): string {
		const builtIn = BUILT_IN_TEXT[rule.id];
		if (builtIn) return builtIn[this.locale].description;
		if (rule.custom) return this.t("customType");
		return rule.description;
	}

	private t(key: TranslationKey): string {
		return STRINGS[this.locale][key];
	}
}
