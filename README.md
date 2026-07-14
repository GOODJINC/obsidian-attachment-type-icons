# Attachment Type Icons

English | [한국어](https://github.com/GOODJINC/obsidian-attachment-type-icons/blob/main/README.ko.md)

An Obsidian community plugin that adds configurable file-type icons to regular internal links for attachments. It never changes your Markdown and skips embedded files and previews.

## Why this plugin exists

Attachment links are often given a clear, human-friendly display name. That keeps notes tidy, but it also hides whether a link opens an image, a PDF, or a spreadsheet. Attachment Type Icons preserves the clean link text and adds just enough visual context to recognize the file type at a glance.

## Before and after

**Before — file types are hidden behind link text**

![Attachment links without file-type icons](assets/attachment-type-icons-before.png)

**After — icons make the link target clear**

![Attachment links with file-type icons](assets/attachment-type-icons-after.png)

## What it looks like

Write a normal internal link with an optional display name:

```md
[[90_Attachments/images/photo.jpg|Laundry-room measurement]]
```

In Reading view, it displays as:

```text
🖼️ Laundry-room measurement
```

The icon is added only to the rendered link. Your Markdown, file name, and link alias are never changed.

## Built-in file types

The following types are enabled by default. All extension matching is case-insensitive.

| Type | Default icon | Default extensions |
| --- | --- | --- |
| Images | 🖼️ | `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`, `heic` |
| PDF & documents | 📄 | `pdf`, `doc`, `docx`, `hwp`, `txt`, `rtf` |
| Spreadsheets | 📊 | `xlsx`, `xls`, `csv`, `ods` |
| Audio | 🔊 | `mp3`, `m4a`, `wav`, `ogg`, `flac` |
| Video | 🎬 | `mp4`, `mov`, `webm`, `mkv` |
| Archives | 📦 | `zip`, `7z`, `rar`, `tar`, `gz` |

Markdown note links are available as an optional type with the `📝` icon, and are disabled by default.

## Settings

Open **Settings → Attachment Type Icons** to customize each built-in type. Every type has three simple controls:

- **Enable or disable** its icon with a toggle.
- **Change the icon** to any emoji or text symbol.
- **Add or remove extensions** in the comma-separated extensions field.

For example, add `heif` and `avif` to the Images extensions field:

```text
jpg, jpeg, png, gif, webp, svg, heic, heif, avif
```

You may include leading dots if you prefer (`.pdf, .epub`). They are removed automatically, so both `.PDF` and `pdf` work the same way.

## Scope

- Works with regular internal links to attachments.
- Does not add an icon to embeds such as `![[photo.jpg]]`, because their preview already identifies the file.
- Does not scan your vault or modify files. It examines only the internal links while a note is rendered.

## Development

```bash
npm install
npm run dev
```

Use `npm run build` for the minified release bundle.
