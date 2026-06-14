const ALLOWED_HTML_TAGS = new Set(["details", "summary"]);

function isAllowedHtmlTag(text: string, index: number): number | null {
  const match = text.slice(index).match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
  if (!match) return null;

  const tagName = match[1].toLowerCase();
  if (!ALLOWED_HTML_TAGS.has(tagName)) return null;

  return match[0].length;
}

function escapeUnsafeLessThan(text: string): string {
  let result = "";
  let index = 0;

  while (index < text.length) {
    if (text[index] !== "<") {
      result += text[index];
      index += 1;
      continue;
    }

    const allowedTagLength = isAllowedHtmlTag(text, index);
    if (allowedTagLength !== null) {
      result += text.slice(index, index + allowedTagLength);
      index += allowedTagLength;
      continue;
    }

    result += "&lt;";
    index += 1;
  }

  return result;
}

/**
 * Sanitize Notion-exported markdown for MDX compilation.
 * Preserves fenced code, inline code, and `<details>` / `<summary>` blocks.
 */
export function sanitizeMdxSource(source: string): string {
  const fencedBlocks = source.split(/(```[\s\S]*?```)/g);

  return fencedBlocks
    .map((segment) => {
      if (segment.startsWith("```")) return segment;

      return segment
        .split(/(`[^`\n]*`)/g)
        .map((part) => {
          if (part.startsWith("`")) return part;
          return escapeUnsafeLessThan(part);
        })
        .join("");
    })
    .join("");
}
