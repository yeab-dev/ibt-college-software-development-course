export {};

type Id = number | string;

const orderId: Id = 4821;
const invoiceId: Id = "INV-4821";

function label(id: Id): string {
  if (typeof id === "string") {
    return id.toUpperCase();
  }
  return `${id}`;
}

function dial(phone: string | null) {
  if (typeof phone == "string") {
    console.log(phone.trim());
  }
}

// four different checks, one per member of the union
type Card = { kind: "card"; last4: string };
type Telebirr = { kind: "telebirr"; phone: string };

function describe(p: Card | Telebirr | Date | string[]): string {
  if (Array.isArray(p)) return p.join(", ");
  if (p instanceof Date) return p.toISOString();
  if ("last4" in p) return `Card ending ${p.last4}`;
  return `TeleBirr ${p.phone}`;
}

console.log(label(orderId), label(invoiceId), describe(new Date(0)));
dial("0911 234 567");
