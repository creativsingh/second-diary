interface HighlightedSnippetProps {
  snippet: string;
  className?: string;
}

/**
 * Safely renders SQLite FTS5 snippets with highlighted <mark> terms.
 * Avoids dangerouslySetInnerHTML to prevent any injection risks while styling matched keywords.
 */
export function HighlightedSnippet({
  snippet,
  className = "",
}: HighlightedSnippetProps) {
  const parts = snippet.split(/(<mark>.*?<\/mark>)/gi);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (
          part.toLowerCase().startsWith("<mark>") &&
          part.toLowerCase().endsWith("</mark>")
        ) {
          const text = part.slice(6, -7);
          return (
            <mark
              key={index}
              className="bg-emerald-500/25 text-emerald-200 font-semibold rounded px-0.5 border border-emerald-500/30"
            >
              {text}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
