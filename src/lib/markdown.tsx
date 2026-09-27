import React from 'react';

export function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={key++} className="my-3 rounded-lg overflow-hidden border border-border-default">
          {lang && (
            <div className="px-4 py-2 bg-surface-3 text-text-tertiary text-xs font-mono flex items-center justify-between">
              <span>{lang}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeLines.join('\n'))}
                className="text-text-tertiary hover:text-text-primary transition-colors text-xs"
              >
                Copy
              </button>
            </div>
          )}
          <pre className="p-4 bg-surface-2 overflow-x-auto text-sm leading-relaxed max-w-full">
            <code className="whitespace-pre">{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Tables
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.match(/^[\s|:-]+$/)) {
      const rows: string[][] = [];
      let j = i;
      while (j < lines.length && lines[j].includes('|')) {
        const cells = lines[j].split('|').map(c => c.trim()).filter(Boolean);
        if (!lines[j].match(/^[\s|:-]+$/)) rows.push(cells);
        j++;
      }
      i = j;
      if (rows.length > 0) {
        elements.push(
          <div key={key++} className="my-3 overflow-x-auto rounded-lg border border-border-default">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2">
                  {rows[0].map((cell, ci) => (
                    <th key={ci} className="px-4 py-2.5 text-left font-semibold text-text-primary border-b border-border-default">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-border-subtle last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-text-secondary">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Headers
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2];
      const cls = level === 1 ? 'text-xl font-bold mt-4 mb-2' : level === 2 ? 'text-lg font-semibold mt-3 mb-1.5' : 'text-base font-semibold mt-2 mb-1';
      elements.push(<div key={key++} className={cls}>{renderInline(text)}</div>);
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[•\-\*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[•\-\*]\s/)) {
        items.push(lines[i].replace(/^[•\-\*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-2 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-text-secondary">
              <span className="text-accent mt-1.5 text-[6px]">●</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={key++} className="my-2 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-text-secondary">
              <span className="text-accent font-medium text-sm min-w-[1.25rem]">{idx + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    elements.push(<p key={key++} className="my-1.5 text-text-secondary leading-relaxed">{renderInline(line)}</p>);
    i++;
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);

    let firstMatch: { type: string; match: RegExpMatchArray; index: number } | null = null;

    if (boldMatch && boldMatch.index !== undefined) {
      firstMatch = { type: 'bold', match: boldMatch, index: boldMatch.index };
    }
    if (codeMatch && codeMatch.index !== undefined) {
      if (!firstMatch || codeMatch.index < firstMatch.index) {
        firstMatch = { type: 'code', match: codeMatch, index: codeMatch.index };
      }
    }

    if (!firstMatch) {
      parts.push(remaining);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }

    if (firstMatch.type === 'bold') {
      parts.push(<strong key={k++} className="font-semibold text-text-primary">{firstMatch.match[1]}</strong>);
    } else {
      parts.push(
        <code key={k++} className="px-1.5 py-0.5 rounded bg-surface-3 text-accent font-mono text-[0.85em]">
          {firstMatch.match[1]}
        </code>
      );
    }

    remaining = remaining.slice(firstMatch.index + firstMatch.match[0].length);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
