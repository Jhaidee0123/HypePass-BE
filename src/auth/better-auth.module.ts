import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { BetterAuthGuard } from './better-auth.guard';
import { BetterAuthController } from './auth.controller';
import { BETTER_AUTH } from './constants';
import { importEsm } from './esm-loader';

@Global()
@Module({
    controllers: [BetterAuthController],
    providers: [
        {
            provide: BETTER_AUTH,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                const { betterAuth } = await importEsm('better-auth');
                const { admin } = await importEsm('better-auth/plugins');
                const { createAccessControl } = await importEsm(
                    'better-auth/plugins/access',
                );
                const pg = await importEsm('pg');
                const Pool = pg.default?.Pool || pg.Pool;

                const statements = {
                    user: [
                        'create',
                        'list',
                        'set-role',
                        'ban',
                        'impersonate',
                        'impersonate-admins',
                        'delete',
                        'set-password',
                        'get',
                        'update',
                    ],
                    session: ['list', 'revoke', 'delete'],
                } as const;

                const ac = createAccessControl(statements);

                const platformAdminRole = ac.newRole({
                    user: [
                        'create',
                        'list',
                        'set-role',
                        'ban',
                        'impersonate',
                        'delete',
                        'set-password',
                        'get',
                        'update',
                    ],
                    session: ['list', 'revoke', 'delete'],
                });
                const userRole = ac.newRole({ user: [], session: [] });

                return betterAuth({
                    basePath: '/api/auth',
                    database: new Pool({
                        host: config.get<string>('database.host'),
                        port: config.get<number>('database.port'),
                        user: config.get<string>('database.username'),
                        password: config.get<string>('database.password'),
                        database: config.get<string>('database.database'),
                    }),
                    emailAndPassword: {
                        enabled: true,
                        minPasswordLength: 8,
                        autoSignIn: true,
                        sendResetPassword: async ({
                            user,
                            url,
                        }: {
                            user: any;
                            url: string;
                        }) => {
                            const fromEmail = config.get<string>(
                                'RESEND_FROM_EMAIL',
                                'HypePass <no-reply@hypepass.co>',
                            );
                            try {
                                const { Resend } = await importEsm('resend');
                                const resend = new Resend(
                                    config.get<string>('RESEND_API_KEY'),
                                );

                                const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#000;font-family:'Space Grotesk',system-ui,sans-serif;color:#ece8e0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0a0908;border:1px solid #34312c;border-radius:4px;">
        <tr><td style="padding:48px 40px;">
          <h1 style="margin:0 0 8px;font-family:'Bebas Neue',Impact,sans-serif;font-size:40px;letter-spacing:0.04em;color:#d7ff3a;">HYPEPASS</h1>
          <h2 style="margin:0 0 16px;font-size:22px;color:#faf7f0;">Restablecer contraseña</h2>
          <p style="margin:0 0 24px;color:#bfbab1;line-height:1.6;">Hola <strong style="color:#faf7f0;">${user.name || ''}</strong>, recibimos una solicitud para restablecer tu contraseña. Usa el siguiente botón para crear una nueva.</p>
          <p style="margin:0 0 32px;">
            <a href="${url}" style="display:inline-block;padding:14px 28px;background:#d7ff3a;color:#000;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;border-radius:4px;">RESTABLECER CONTRASEÑA</a>
          </p>
          <p style="margin:0;color:#6b6760;font-size:12px;">Si no solicitaste este cambio, ignora este correo. Este enlace expira en 1 hora.</p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;color:#4a4741;font-size:11px;">© ${new Date().getFullYear()} HypePass</p>
    </td></tr>
  </table>
</body>
</html>`;

                                const result = await resend.emails.send({
                                    from: fromEmail,
                                    to: user.email,
                                    subject: 'HypePass — Restablecer contraseña',
                                    html,
                                });
                                if (result?.error) {
                                    console.error(
                                        `[BetterAuth] Resend rejected reset email to ${user.email} (from=${fromEmail}): ${JSON.stringify(result.error)}`,
                                    );
                                } else {
                                    console.log(
                                        `[BetterAuth] Reset email sent to ${user.email} via Resend (id=${result?.data?.id ?? '?'}, from=${fromEmail})`,
                                    );
                                }
                            } catch (err: any) {
                                console.error(
                                    `[BetterAuth] Error enviando reset email a ${user.email} (from=${fromEmail}): ${err?.message ?? 'unknown'}`,
                                    err?.stack,
                                );
                            }
                        },
                    },
                    plugins: [
                        admin({
                            defaultRole: 'user',
                            adminRoles: ['platform_admin'],
                            roles: {
                                user: userRole,
                                platform_admin: platformAdminRole,
                            },
                        }),
                    ],
                    session: {
                        expiresIn: 60 * 60 * 24 * 7,
                        updateAge: 60 * 60 * 24,
                    },
                    trustedOrigins: config
                        .get<string>('CORS_ORIGIN', 'http://localhost:8090')
                        .split(','),
                });
            },
        },
        {
            provide: APP_GUARD,
            useClass: BetterAuthGuard,
        },
    ],
    exports: [BETTER_AUTH],
})
export class BetterAuthModule {}
