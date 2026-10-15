const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// Affiche une ligne de note : tout le HTML est neutralisé sauf le gras (<b>), seul format conservé au collage
export function RichText({ text }: { text: string }) {
    const html = escapeHtml(text).replace(/&lt;(\/?)b&gt;/g, "<$1b>")
    return <span dangerouslySetInnerHTML={{ __html: html }} />
}
