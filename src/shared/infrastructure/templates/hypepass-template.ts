/**
 * HypePass email chrome — dark canvas + electric-lime accent, matches the Pulse
 * design language. Inline styles only (most clients ignore <style> blocks).
 */
export function wrapInHypePassTemplate(body: string): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HypePass</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ece8e0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0908;border:1px solid #34312c;border-radius:6px;">
<tr><td style="padding:40px 40px 16px;text-align:left;">
<h1 style="margin:0;font-family:Impact,'Bebas Neue',sans-serif;font-size:36px;letter-spacing:0.06em;color:#d7ff3a;line-height:1;">HYPEPASS</h1>
</td></tr>
<tr><td style="padding:8px 40px 48px;color:#ece8e0;font-size:15px;line-height:1.7;">
${body}
</td></tr>
</table>
<p style="margin:24px 0 0;color:#4a4741;font-size:11px;">© ${year} HypePass · Medellín, Colombia</p>
</td></tr>
</table>
</body>
</html>`;
}
