/**
 * Regras de domínio da plataforma de encomendas com pagamento na entrega.
 *
 * REGRA CENTRAL: uma ENCOMENDA só se transforma em VENDA (receita) quando o
 * estado passa a "entregue". Todos os cálculos de receita neste ficheiro
 * respeitam essa regra.
 */

export const PROVINCES = [
  "Maputo Cidade",
  "Maputo Província",
  "Gaza",
  "Inhambane",
  "Sofala",
  "Manica",
  "Tete",
  "Zambézia",
  "Nampula",
  "Cabo Delgado",
  "Niassa",
] as const;

export type OrderStatus =
  | "nova"
  | "por_ligar"
  | "agendada"
  | "nao_atende"
  | "numero_invalido"
  | "confirmada"
  | "preparacao"
  | "em_entrega"
  | "entregue"
  | "cancelada"
  | "recusada"
  | "reagendar";

export type StatusTone = "new" | "info" | "warn" | "ok" | "danger" | "neutral";

export interface StatusMeta {
  value: OrderStatus;
  label: string;
  tone: StatusTone;
}

export const STATUSES: StatusMeta[] = [
  { value: "nova", label: "Nova encomenda", tone: "new" },
  { value: "por_ligar", label: "Por ligar", tone: "warn" },
  { value: "agendada", label: "Ligação agendada", tone: "info" },
  { value: "nao_atende", label: "Não atende", tone: "warn" },
  { value: "numero_invalido", label: "Número inválido", tone: "danger" },
  { value: "confirmada", label: "Confirmada", tone: "ok" },
  { value: "preparacao", label: "Em preparação", tone: "info" },
  { value: "em_entrega", label: "Em entrega", tone: "info" },
  { value: "entregue", label: "Entregue", tone: "ok" },
  { value: "cancelada", label: "Cancelada", tone: "danger" },
  { value: "recusada", label: "Cliente recusou", tone: "danger" },
  { value: "reagendar", label: "Reagendar", tone: "warn" },
];

export const STATUS_MAP: Record<string, StatusMeta> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s]),
);

export function statusLabel(value: string): string {
  return STATUS_MAP[value]?.label ?? value;
}

export const CONTACT_PERIODS = ["Manhã", "Tarde", "Noite"] as const;

export const TIME_SLOTS = [
  "08:00 – 10:00",
  "10:00 – 12:00",
  "12:00 – 14:00",
  "14:00 – 16:00",
  "16:00 – 18:00",
  "18:00 – 20:00",
] as const;

export const CANCEL_REASONS = [
  "Cliente desistiu",
  "Preço",
  "Não tem dinheiro",
  "Localização muito distante",
  "Número falso",
  "Cliente não atende",
  "Produto indisponível",
  "Duplicado",
  "Outro",
] as const;

export const TEAM_ROLES = [
  { value: "administrador", label: "Administrador" },
  { value: "operador", label: "Operador de chamadas" },
  { value: "gestor", label: "Gestor de encomendas" },
  { value: "entregador", label: "Entregador" },
] as const;

/** Estados que ainda aguardam contacto telefónico da equipa. */
export const TO_CALL_STATUSES: OrderStatus[] = [
  "nova",
  "por_ligar",
  "nao_atende",
  "reagendar",
  "agendada",
];

/** Formata um valor em Meticais de forma consistente. */
export function formatMT(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString("pt-MZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MT`;
}

/** Remove tudo o que não seja dígito. */
export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

/**
 * Valida um número de telemóvel de Moçambique (84/85/86/87 + 7 dígitos).
 * Aceita o número com ou sem o indicativo 258.
 */
export function normalizeMozPhone(raw: string): string | null {
  let d = digitsOnly(raw);
  if (d.startsWith("258")) d = d.slice(3);
  if (!/^8[4-7]\d{7}$/.test(d)) return null;
  return d;
}

export function isValidMozPhone(raw: string): boolean {
  return normalizeMozPhone(raw) !== null;
}

export function telLink(phone: string): string {
  const n = normalizeMozPhone(phone) ?? digitsOnly(phone);
  return `tel:+258${n}`;
}

export function whatsappLink(phone: string, message: string): string {
  const n = normalizeMozPhone(phone) ?? digitsOnly(phone);
  return `https://wa.me/258${n}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_WA_TEMPLATE =
  "Olá {CLIENTE}, estamos a entrar em contacto sobre a sua encomenda de {PRODUTO}.";

export function buildWaMessage(template: string, customer: string, product: string): string {
  return template.replace(/\{CLIENTE\}/g, customer).replace(/\{PRODUTO\}/g, product);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tempo decorrido em linguagem simples, ex.: "há 2h 15m". */
export function timeAgo(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `há ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h ${mins % 60}m`;
  return `há ${Math.floor(hours / 24)}d`;
}
