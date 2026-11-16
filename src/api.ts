function formatInlineHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

export function markdownToKdpHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (/^\s*[*|-]\s+/.test(rawLine)) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      const itemText = rawLine.replace(/^\s*[*|-]\s+/, '').trim();
      htmlParts.push(`  <li>${formatInlineHtml(itemText)}</li>`);
      continue;
    }

    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }

    if (line.startsWith('#')) {
      const headingText = line.replace(/^#+\s*/, '').trim();
      htmlParts.push(`<h4><b>${formatInlineHtml(headingText)}</b></h4>`);
    } else {
      htmlParts.push(`<p>${formatInlineHtml(line)}</p>`);
    }
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

export function downloadFormattedDoc(title: string, markdown: string): string {
  const cleanTitle = (title || 'Untitled Book').trim();
  const safeFilename = `Book Blurb - ${cleanTitle.replace(/[^a-z0-9\s-_]/gi, '').trim() || 'Untitled'}.doc`;
  const bodyHtml = markdownToKdpHtml(markdown);

  const docHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>Book Blurb - ${cleanTitle}</title>
<style>
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1c3447;
    max-width: 6.5in;
    margin: 1in auto;
  }
  .doc-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 18pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #1c3447;
    margin-bottom: 4pt;
  }
  .doc-subtitle {
    font-family: Arial, sans-serif;
    font-size: 10pt;
    font-weight: bold;
    letter-spacing: 1.5pt;
    color: #C9A66B;
    border-bottom: 1.5pt solid #C9A66B;
    padding-bottom: 8pt;
    margin-bottom: 18pt;
  }
  h4 {
    font-family: Georgia, serif;
    font-size: 13pt;
    font-weight: bold;
    color: #1c3447;
    margin-top: 14pt;
    margin-bottom: 6pt;
  }
  p {
    margin-top: 0;
    margin-bottom: 10pt;
  }
  ul {
    margin-top: 6pt;
    margin-bottom: 12pt;
    padding-left: 20pt;
  }
  li {
    margin-bottom: 4pt;
  }
</style>
</head>
<body>
  <div class="doc-title">${formatInlineHtml(cleanTitle)}</div>
  <div class="doc-subtitle">THE MODERN AUTHOR • BOOK DESCRIPTION</div>
  ${bodyHtml}
</body>
</html>`;

  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return safeFilename;
}
