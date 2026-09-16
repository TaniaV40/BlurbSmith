export interface ExportResult {
  docId: string;
  docUrl: string;
}

export async function exportToGoogleDoc(accessToken: string, title: string, content: string): Promise<ExportResult> {
  const res = await fetch('/api/export-google-doc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userAccessToken: accessToken,
      title,
      blurbContent: content,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(errorData.error || 'Failed to export to Google Docs');
  }

  const data = await res.json();
  return {
    docId: data.docId,
    docUrl: data.docUrl || `https://docs.google.com/document/d/${data.docId}/edit`,
  };
}

