# HypePass-BE — Guía de Arquitectura

Backend NestJS 11 para la plataforma multi-tenant **HypePass** (ticketing + marketplace).
Clean Architecture / Hexagonal por feature. **PostgreSQL + TypeORM**. Auth con **Better Auth** (servidor).

## Stack

- NestJS 11 + TypeScript 5.7 (`module: commonjs`, `target: ES2021`)
- TypeORM 0.3 + PostgreSQL (`pg` 8.x)
- Better Auth 1.5 (servidor, plugin `admin`, cookie sessions, email+password)
- Validación: `class-validator` + `class-transformer` con `ValidationPipe` global
- Config: `@nestjs/config` + **Joi** schema (`src/config/env.validation.ts`)
- Docs: `@nestjs/swagger` en `GET /api/docs`
- Pagos: Wompi (se integra en Iteración 6)
- Email: Resend (se integra donde aplica; reset-password ya en `BetterAuthModule`)
- Jest + Supertest

## Regla de dependencias

```
Controller (infra)  →  UseCase (application)  →  Service / IRepository (domain)
                                                         ↓
                                            ORM Entity + Mapper (infra)
                                                         ↓
                                                    PostgreSQL
```

- **domain** no importa de `application` ni `infrastructure`.
- **application** no importa de `infrastructure`.
- **infrastructure** conoce todo: adapta framework/DB al dominio.

## Estructura de un módulo de feature

Referencia: `src/companies/`, `src/users/`.

```
src/<feature>/
├── <feature>.module.ts                # Registro DI + TypeOrmModule.forFeature
├── domain/
│   ├── entities/<feature>.entity.ts   # Clase de dominio (extends BaseEntity)
│   ├── repositories/<feature>.repository.ts  # Interface I<Feature>Repository
│   └── types/
│       ├── <feature>.props.ts
│       ├── <feature>-query-filter.ts
│       └── <feature>-status.ts        # enums si aplica
├── application/
│   ├── dto/
│   │   └── <action>-<feature>.dto.ts  # class-validator + Swagger
│   ├── services/<feature>.service.ts  # implements I<Feature>Repository
│   └── use-case/<action>-<feature>.usecase.ts
└── infrastructure/
    ├── controllers/<feature>.controller.ts
    ├── controllers/admin-<feature>.controller.ts  # si hay endpoints admin
    ├── guards/*.guard.ts              # opcional, feature-scoped
    ├── mapper/<feature>.mapper.ts      # toDomain / toPersistance
    ├── orm/<feature>.orm.entity.ts     # @Entity (extends BaseOrmEntity)
    └── tokens/<feature>.tokens.ts      # Symbols para DI
```

## Convenciones

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | kebab-case con sufijo | `create-company.usecase.ts`, `company.orm.entity.ts` |
| Clases | PascalCase | `CompanyService`, `CreateCompanyUseCase` |
| Interfaces | `I` + PascalCase | `ICompanyRepository` |
| Types/Props | PascalCase | `CompanyProps`, `CompanyQueryFilter` |
| DTOs | `*.dto.ts`, class-validator decorators + `@ApiProperty` | `CreateCompanyDto` |
| Tokens DI | `snake_case` + `_token` → `Symbol('UPPER_SNAKE')` | `company_service_token` |
| Rutas HTTP | kebab-case / lowercase | `/companies`, `/admin/companies` |
| Columnas Postgres | `snake_case` | `created_at`, `reviewed_by_user_id` |
| Tablas | `snake_case` plural | `companies`, `company_memberships` |
| Enums en DB | `varchar(length)` con default string | `status: 'pending'` |
| Env vars | SCREAMING_SNAKE | `DB_HOST`, `WOMPI_PUBLIC_KEY` |

Sufijos estandarizados: `.controller.ts`, `.service.ts`, `.module.ts`, `.entity.ts`, `.orm.entity.ts`, `.repository.ts`, `.mapper.ts`, `.usecase.ts`, `.dto.ts`, `.props.ts`, `.tokens.ts`, `.guard.ts`, `.spec.ts`, `.e2e-spec.ts`.

## Abstracciones compartidas

- `src/shared/domain/entities/base.entity.ts` → `BaseEntity` (id UUID generado en constructor, createdAt, updatedAt). **Toda entidad de dominio debe extenderla.**
- `src/shared/domain/repositories/` → `IReadOnlyRepository`, `IWriteOnlyRepository`, `IBaseRepository` (combina ambas). **Toda interface de repositorio debe extender `IBaseRepository`.**
- `src/shared/infrastructure/orm/base.orm-entity.ts` → `BaseOrmEntity` (id, `created_at`, `updated_at`). **Toda ORM entity nuestra extiende de aquí.** Excepción: la tabla `user` es manejada por Better Auth y tiene su propio layout camelCase (ver `src/users/infrastructure/orm/user.orm.entity.ts`).
- `src/shared/infrastructure/filters/domain.exception.ts` → `DomainException` y subclases: `NotFoundDomainException`, `ConflictDomainException`, `ForbiddenDomainException`, `UnprocessableDomainException`. **Usa estas en lugar de `throw new Error`** para que el filter global produzca respuestas consistentes.
- `src/shared/infrastructure/filters/domain-exception.filter.ts` → filtro global registrado en `AppModule`.

## Auth

- `src/auth/better-auth.module.ts` — instancia Better Auth vía `importEsm` (workaround CJS ↔ ESM). Plugin `admin` con roles: `user`, `platform_admin`. Email+password + reset por Resend.
- `src/auth/better-auth.guard.ts` — **`APP_GUARD` global**. Bloquea todo por defecto; libera con `@AllowAnonymous()`. Valida sesión y, si hay `@Roles([...])`, valida rol del sistema. `platform_admin` pasa todos los checks.
- `src/auth/auth.controller.ts` — expone `All('/api/auth/*')` al handler de Better Auth.
- `src/auth/decorators/`:
  - `@AllowAnonymous()` — ruta pública.
  - `@Roles([...])` — requiere rol de sistema (`user`, `platform_admin`).
  - `@Session()` — inyecta `UserSession` del request.
  - `@CompanyRoles([...])` — usado con `TenantGuard`; exige rol de membresía.
- Roles del sistema en `SYSTEM_ROLES` (`platform_admin`, `user`).
- Roles de compañía en `COMPANY_ROLES` (`owner`, `admin`, `staff`, `checkin_staff`).

## Tenancy

- `src/companies/infrastructure/guards/tenant.guard.ts` — para rutas bajo `/companies/:companyId/*`. Valida que el usuario tenga membresía en esa compañía. Respeta `@CompanyRoles([...])`. `platform_admin` pasa por alto. Exportado por `CompaniesModule`.
- Al crear un módulo que dependa de la identidad de una compañía (ej. `events`), importa `CompaniesModule` y usa `@UseGuards(TenantGuard)` con `@CompanyRoles([...])`.

## Base de datos y migraciones

- **Dev**: `synchronize: true` (al iniciar Nest, se crean/actualizan tablas desde `@Entity`).
- **Prod**: `synchronize: false` + migraciones en `dist/database/migrations/*.js`.
- CLI: `src/database/data-source.ts` (`yarn typeorm ...`, `yarn migration:generate`, `yarn migration:run`, `yarn migration:revert`).
- Las tablas `user`, `session`, `account`, `verification` están gobernadas por Better Auth (marcadas `synchronize: false`). Better Auth **no crea el schema solo** — hay que inicializarlo una vez por ambiente:
  ```bash
  yarn auth:init-schema         # corre scripts/better-auth-init.sql contra la DB
  # o la vía oficial de Better Auth 1.5:
  # npx @better-auth/cli@latest generate --output=./better-auth.sql
  ```
  El SQL bootstrap es idempotente (`CREATE TABLE IF NOT EXISTS`), seguro de re-ejecutar. Si cambian los plugins/config de Better Auth, regenera con la CLI oficial o ajusta el SQL a mano.

## Playbook: crear un módulo nuevo

1. **Domain**
   - `<feature>.props.ts` (BaseProps + campos).
   - `<feature>.entity.ts` (`extends BaseEntity`, `readonly` en todos los campos).
   - `<feature>-query-filter.ts`.
   - `<feature>.repository.ts` → `interface I<Feature>Repository extends IBaseRepository<<Feature>Entity, <Feature>QueryFilter>`.

2. **Infrastructure**
   - `<feature>.orm.entity.ts` → `@Entity({ name: '<feature_plural>' })` + `extends BaseOrmEntity` (salvo que sea tabla de Better Auth).
   - `<feature>.mapper.ts` → `toDomain(orm)` y `toPersistance(entity)` (retorno `Partial<OrmEntity>`).
   - `<feature>.tokens.ts` → un `Symbol` por service y por use case.

3. **Application**
   - `<feature>.service.ts` → `@Injectable`, `implements I<Feature>Repository`, inyecta `Repository<OrmEntity>` vía `@InjectRepository`. Usa el mapper en cada retorno.
   - `<action>-<feature>.usecase.ts` → clase con `execute(...)`; lanza `DomainException`s.
   - DTOs con `class-validator` + `@ApiProperty`.

4. **Controller(s)**
   - User-facing: `<feature>.controller.ts` — `@ApiTags`, `@ApiCookieAuth`, `@Controller('<feature>')`. Inyecta use cases vía `@Inject(token)`.
   - Admin: `admin-<feature>.controller.ts` — `@Roles([SYSTEM_ROLES.PLATFORM_ADMIN])`, `@Controller('admin/<feature>')`.
   - Tenant: en rutas `/<feature>/:companyId/*` → `@UseGuards(TenantGuard)` + `@CompanyRoles([...])`.

5. **Module**
   - `TypeOrmModule.forFeature([...OrmEntities])` en `imports`.
   - Providers con `useClass` para services y `useFactory` (+ `inject`) para use cases.
   - Exporta tokens que otros módulos necesiten consumir.
   - Registra el módulo en `src/app.module.ts`.

## Scripts

```bash
npm run start:dev        # hot reload
npm run build            # compila a dist/
npm run format           # prettier
npm run lint             # eslint --fix
npm run test             # jest
npm run test:e2e         # jest e2e
npm run migration:generate <nombre>
npm run migration:create  <nombre>
npm run migration:run
npm run migration:revert
```

## Estado por iteración

- **Iteración 1 (hecha)**: Postgres + migrations tooling, ConfigModule + Joi, ValidationPipe global, DomainExceptionFilter global, Swagger, Better Auth server, `users` (read-only sobre tabla de Better Auth), `companies` + `company_memberships`, `TenantGuard`, roles del sistema y de compañía. Endpoints:
  - `GET /api/health`
  - Auth: `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out` (Better Auth)
  - `GET /api/users/me`
  - `GET /api/users` (admin)
  - `POST /api/companies`, `GET /api/companies/mine`
  - `GET /api/companies/:companyId/members`, `POST /api/companies/:companyId/members`
  - `GET /api/admin/companies`, `PATCH /api/admin/companies/:id/approve`, `PATCH /api/admin/companies/:id/reject`

- **Iteración 2**: FE foundations (layout, i18n ES/EN, paleta Pulse/HypePass, refactor de pages).
- **Iteración 3 (hecha)**: `src/shared/shared.module.ts` global con `CloudinaryService` y `POST /api/upload/image` (multer + cloudinary). Módulos `venues`, `categories` (público + admin), `events` con todas las tablas anidadas (events, event_sessions, ticket_sections, ticket_sale_phases, event_media). Endpoints organizer en `/companies/:companyId/events/...`. Reglas: overlap de fases bloqueado, submit-for-review valida completitud (sesión → secciones → fases).
- **Iteración 4**: Admin review / approval workflow.
- **Iteración 5**: Public discovery.
- **Iteración 6**: Primary checkout + Wompi.
- **Iteración 7 (hecha)**: Tablas `ticket_qr_tokens` + `checkins` en `tickets` module. `QrTokenService` (HMAC-SHA256 signed tokens con `tid + qrv + ov + iat + exp`, TTL 60s) en `SharedModule`. Módulo `wallet` con `GET /api/wallet/tickets`, `/:id`, `/:id/qr` (éste rechaza si ventana de visibilidad no abierta). Módulo `checkin` con `POST /api/checkin/scan` — valida firma, staleness de versión (qrv/ov), status, owner company membership, session open (`checkinStartAt + grace`), QR visibility, duplicate scan. Registra cada intento en `checkins` con `result` + `rejection_reason` detallado. Helper `computeQrVisibleFrom` aplica priority: `session.qrVisibleFrom` → `event.defaultQrVisibleHoursBefore` → `DEFAULT_QR_VISIBLE_HOURS_BEFORE` env.
- **Iteración 8**: Transfer.
- **Iteración 9 (hecha)**: Marketplace `src/marketplace/` con tablas `resale_listings`, `resale_orders`, `payout_records`. Use cases: `create-resale-listing` (con price cap `faceValue * RESALE_PRICE_CAP_MULTIPLIER`, valida `event.resaleEnabled + section.resaleAllowed + session.resaleCutoffAt`, atómico flip ticket→LISTED), `cancel-resale-listing` (solo ACTIVE, ticket→ISSUED), `list-my-resale-listings`, `list-active-resale-listings`, `get-resale-listing`, `initiate-resale-checkout` (lock listing, flip→RESERVED, crea `orders` type=RESALE + `resale_orders` + `payments` + firma Wompi), `settle-resale-order` (ejecutado desde webhook/verify cuando `order.type=RESALE`: transfiere propiedad del ticket + bump `ownership_version` + `qr_generation_version` + desactiva tokens QR + listing→SOLD + payout PAYABLE al vendedor; `release()` revierte cuando el pago falla). Endpoints: `GET/POST /api/marketplace/listings`, `GET /api/marketplace/listings/:id`, `POST /api/marketplace/checkout/initiate`; `GET/POST /api/wallet/listings`, `DELETE /api/wallet/listings/:id`. `HandleWebhookUseCase` y `VerifyPaymentUseCase` ramifican por `order.type`.

- **Iteración 10 Lote 3 (hecha) — Hardening nice-to-have BE**:
  - `nestjs-pino` global (`LoggerModule.forRootAsync`) + `app.useLogger(PinoLogger)`. Redact en `req.headers.authorization`, `req.headers.cookie`, `req.body.password*`. Pretty en dev, JSON en prod. `autoLogging.ignore` para `/api/health` y `/api/docs`. `customLogLevel` por status.
  - Módulo `src/audit/` **@Global**: tabla `audit_logs` (actor_kind, actor_user_id, action, target_type, target_id, metadata jsonb). `AuditLogService.record()` fire-and-forget — nunca rompe la acción. Integrado en: `ApproveCompanyUseCase`, `RejectCompanyUseCase`, `ApproveEventUseCase`, `RejectEventUseCase`, `PublishEventUseCase`, `UnpublishEventUseCase`, `RotateEventQrUseCase`, `MarkPayoutUseCase` (paid/failed/cancelled). Acción type-safe (`AuditLogAction` union).
  - `PATCH /api/wallet/listings/:id` → `UpdateResaleListingUseCase`. Sólo ACTIVE. Si cambia `askPrice`, re-aplica `event.resalePriceCapMultiplier ?? env` y recomputa `platformFeeAmount`/`sellerNetAmount` con `event.resaleFeePct ?? env`. Valida ownership.

- **Iteración 10 Lote 2 (hecha) — UX hardening BE**:
  - `ApproveCompanyUseCase` + `RejectCompanyUseCase` notifican por email a los OWNERs (helper `collectOwnerEmails`). Emails branded con CTA a `/organizer`.
  - `events.resale_price_cap_multiplier` (nullable `numeric(4,2)`), `events.resale_fee_pct` (nullable `numeric(5,2)`), `events.max_tickets_per_user_per_session` (nullable int). DTO `CreateEventDto` + `UpdateEventDto` aceptan los tres; use cases los propagan.
  - `CreateResaleListingUseCase` usa `event.resalePriceCapMultiplier ?? env` para el cap y `event.resaleFeePct ?? env` para la comisión.
  - `InitiateCheckoutUseCase` aplica `event.maxTicketsPerUserPerSession` contando tickets OWNABLE+CHECKED_IN del user en esa sesión + holds ACTIVE. Lanza `PER_USER_SESSION_CAP`.

- **Iteración 10 Lote 1 (hecha) — Hardening BE**:
  - `@nestjs/schedule` con `SweepersModule`: `ExpireHoldsSweeper` (cada minuto, `inventory_holds` ACTIVE expirados → EXPIRED), `ExpireListingsSweeper` (cada 5 min, `resale_listings` ACTIVE expirados → EXPIRED + ticket→ISSUED), `ReleaseReservationsSweeper` (cada minuto, `resale_listings` RESERVED vencidos → ACTIVE + ticket→LISTED + `resale_orders`→EXPIRED + `orders`→EXPIRED). Desactivable con `SWEEPER_ENABLED=false`.
  - `@nestjs/throttler` global (120/min) + `@Throttle()` más estricto en `/auth/*` (20/min) y `/checkout/initiate|guest-initiate` (10/min). `/checkout/webhook` usa `@SkipThrottle` para no bloquear Wompi. Envs `THROTTLE_*` en `env.validation`.
  - Guest checkout ya no envía password — usa `auth.api.forgetPassword` → reset link con template branded (`sendResetPassword` de `BetterAuthModule`). El welcome email solo avisa dónde entrar.
  - `ScanTicketUseCase` valida rol de compañía: solo `OWNER`, `ADMIN`, `CHECKIN_STAFF` pueden escanear (además de `PLATFORM_ADMIN`). Lanza `INSUFFICIENT_COMPANY_ROLE`.
  - `GET /api/health` chequea Postgres con `SELECT 1` y reporta `db.status`, `db.latencyMs`, `uptimeSec`.
  - Flag `orders.needs_reconciliation` + `reconciliation_reason` (nuevas columnas). `issueTicketsForOrder` re-valida inventario bajo lock antes de emitir; si detecta oversell (otro hold activo + existing issued > capacidad), marca la orden `PAID + needs_reconciliation=true, reason='OVERSOLD_AFTER_HOLD_EXPIRED'` y NO emite tickets. Ops debe refund/override manual.
  - Admin payouts: `GET /api/admin/payouts?status=payable&sellerUserId=...`, `PATCH /api/admin/payouts/:id/mark-paid|mark-failed|cancel` — solo transiciona de PAYABLE. No dispersa plata (eso es out-of-band).
  - Admin QR rotation: `PATCH /api/admin/events/:eventId/rotate-qr` — bump `qr_generation_version` a todos los tickets del evento + desactiva cada `ticket_qr_tokens.active=true`. Retorna `{ rotatedTickets, deactivatedTokens }`.

### Migraciones (producción)

- Dev sigue con `synchronize: true`. Para prod **antes de deploy**:
  1. Levantar Postgres limpio con el schema actual (o apuntar a una réplica).
  2. `yarn migration:generate src/database/migrations/init` → produce el baseline completo.
  3. En `src/config/database.config.ts` apagar `synchronize: false` cuando `NODE_ENV=production`.
  4. Compilar (`yarn build`) y en el servidor correr `yarn migration:run` al inicio del deploy (antes de arrancar Nest).
- Nuevos cambios de schema se capturan con `yarn migration:generate src/database/migrations/<name>`.
- **Iteración 10**: Tests + hardening.

## Archivos de referencia

- Módulos ejemplo completos: `src/users/`, `src/companies/`.
- Bootstrap: `src/main.ts`.
- Root module: `src/app.module.ts`.
- Auth: `src/auth/`.
- Shared: `src/shared/`.
- Config: `src/config/`.
- Data source CLI: `src/database/data-source.ts`.
