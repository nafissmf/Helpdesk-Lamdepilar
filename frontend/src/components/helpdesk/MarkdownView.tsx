import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const source = text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&#039;|&apos;/g, "'");
  const parts = source.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-red-50 px-1 font-mono text-sm text-red-600">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function MarkdownView({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("|")) {
      const table: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!/^\|\s*-+/.test(lines[i])) {
          table.push(
            lines[i]
              .split("|")
              .slice(1, -1)
              .map((cell) => cell.trim())
          );
        }
        i += 1;
      }
      blocks.push(
        <div key={key++} className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {table.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? "bg-gray-50 font-medium" : ""}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-200 px-3 py-2">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    const image = line.match(/^!\[([^\]]*)]\(([^)]+)\)$/);
    if (image) {
      blocks.push(
        <img key={key++} src={image[2]} alt={image[1]} className="max-w-full rounded-xl border border-gray-200" />
      );
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={key++} className="text-base font-semibold text-gray-800">{inline(line.slice(4))}</h3>);
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="border-b border-gray-200 pb-2 text-lg font-semibold text-gray-900">
          {inline(line.slice(3))}
        </h2>
      );
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(<h1 key={key++} className="text-2xl font-semibold text-gray-900">{inline(line.slice(2))}</h1>);
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      blocks.push(
        <ul key={key++} className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          {items.map((item, index) => <li key={index}>{inline(item)}</li>)}
        </ul>
      );
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={key++} className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
          {items.map((item, index) => <li key={index}>{inline(item)}</li>)}
        </ol>
      );
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^#{1,3}\s|^-\s|^\d+\.\s|^\||^!\[/.test(lines[i])) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push(<p key={key++} className="text-sm leading-6 text-gray-700">{inline(paragraph.join(" "))}</p>);
  }

  return <div className="space-y-4">{blocks}</div>;
}
