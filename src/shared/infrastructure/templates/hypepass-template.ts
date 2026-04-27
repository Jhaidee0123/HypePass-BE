/**
 * HypePass email chrome — dark canvas + electric-lime accent, matches the Pulse
 * design language. Inline styles only (most clients ignore <style> blocks).
 *
 * Layout:
 *   [outer 64px padding]
 *     [logo image, 140px wide]
 *     [card with 3px lime accent bar on top]
 *       [body content, 56px padding]
 *       [thin divider + tagline]
 *     [outer footer: copyright + links]
 *   [outer 64px padding]
 */
export function wrapInHypePassTemplate(body: string): string {
    const year = new Date().getFullYear();
    const appUrl = process.env.APP_URL ?? 'https://hypepass.co';
    const logoUrl =
        process.env.EMAIL_LOGO_URL ?? `${appUrl}/main-logo-transparent.png`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>HypePass</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ece8e0;">

<!-- Outer wrapper with generous breathing room -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:64px 16px;">
<tr><td align="center">

<!-- Logo header (outside the card) -->
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin:0 auto;">
<tr><td align="center" style="padding-bottom:32px;">
<a href="${appUrl}" style="text-decoration:none;border:0;display:inline-block;">
<img src="${logoUrl}" alt="HypePass" width="140" style="width:140px;max-width:140px;height:auto;display:block;border:0;outline:none;-ms-interpolation-mode:bicubic;">
</a>
</td></tr>
</table>

<!-- Card -->
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0908;border:1px solid #34312c;border-radius:8px;border-collapse:separate;overflow:hidden;">

<!-- Lime accent bar on top of the card -->
<tr><td style="background:#d7ff3a;height:3px;line-height:3px;font-size:0;mso-line-height-rule:exactly;">&nbsp;</td></tr>

<!-- Body content (host page provides the inner styles) -->
<tr><td style="padding:48px 40px 32px;color:#ece8e0;font-size:15px;line-height:1.7;">
${body}
</td></tr>

<!-- Tagline divider inside the card -->
<tr><td style="padding:0 40px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1a1917;">
<tr><td style="padding-top:20px;font-family:'Courier New','SFMono-Regular',monospace;font-size:10px;letter-spacing:0.22em;color:#6b6760;text-transform:uppercase;">
● LIVE EVENTS &nbsp;·&nbsp; REAL ACCESS
</td></tr>
</table>
</td></tr>

</table>

<!-- Outer footer -->
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin:32px auto 0;">
<tr><td align="center" style="padding:0 16px;">
<p style="margin:0 0 10px;color:#908b83;font-size:12px;line-height:1.6;">
<a href="${appUrl}" style="color:#d7ff3a;text-decoration:none;font-weight:600;">hypepass.co</a>
&nbsp;·&nbsp;
<a href="mailto:hola@hypepass.co" style="color:#908b83;text-decoration:none;">hola@hypepass.co</a>
</p>
<p style="margin:0;color:#4a4741;font-size:11px;line-height:1.5;">
© ${year} HypePass · Medellín, Colombia
</p>
<p style="margin:8px 0 0;color:#4a4741;font-size:10px;line-height:1.5;">
Recibiste este correo porque estás registrado en HypePass o un organizador te incluyó en su evento.
</p>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}
