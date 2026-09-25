interface HighlightedSnippetProps {
  snippet: string;
  className?: string;
}

/**
 * Safely renders SQLite FTS5 snippets with highlighted <mark> terms.
 * Avoids dangerouslySetInnerHTML to prevent injection risks while styling matched keywords.
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
              className="bg-[#f0ece8] text-[#7c6f5b] font-medium rounded px-1 py-0.5 border border-[#ece9e4]"
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
