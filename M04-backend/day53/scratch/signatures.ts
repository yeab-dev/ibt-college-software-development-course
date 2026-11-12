export {};

function deliveryFee(area: string, totalSantim: number) {
  if (totalSantim >= 50000) return 0;
  return area === "Bole" ? 4000 : 6000;
}

const feeFor = (area: string): number => (area === "Bole" ? 4000 : 6000);

function logOrder(id: number): void {
  console.log(`Order ${id}`);
}

function fail(message: string): never {
  throw new Error(message);
}

function requireArea(area: string | undefined): string {
  if (area === undefined) fail("no area given");
  return area;
}

const bill = 32000 + deliveryFee("Bole", 32000);
