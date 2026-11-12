export {};

// ---- type: unions, tuples, functions (an interface can't name these) ----
type OrderStatus = "PENDING" | "PREPARING" | "DELIVERED";
type LatLng = [lat: number, lng: number];
type FeeRule = (area: string, totalSantim: number) => number;

// ---- interface: object shapes and contracts ----
interface Restaurant {
  readonly id: number;
  name: string;
  area: string;
  location?: LatLng;
}

interface DeliveryRestaurant extends Restaurant {
  deliversTo: string[];
}

interface Order {
  readonly id: number;
  area: string;
  totalSantim: number;
  status: OrderStatus;
}

interface OrderRepository {
  byId(id: number): Order | undefined;
}

// ---- a class promises to satisfy an interface ----
class YodAbyssinia implements DeliveryRestaurant {
  readonly id = 1;
  name = "Yod Abyssinia";
  area = "Bole";
  deliversTo = ["Bole", "Kazanchis"];
}

// ---- structural typing: the shape is what counts, not the name ----
function describe(r: Restaurant): string {
  return `#${r.id} ${r.name} (${r.area})`;
}

const kategna = { id: 2, name: "Kategna", area: "Bole", rating: 4.6 };
console.log(describe(new YodAbyssinia())); // class that said `implements`
console.log(describe(kategna)); // plain object that never mentions Restaurant

// ---- a service that is handed its dependencies ----
class OrderService {
  private readonly repo: OrderRepository;
  private readonly fee: FeeRule;

  // Nest writes these 4 lines as:
  //   constructor(private readonly repo: OrderRepository, private readonly fee: FeeRule) {}
  // Node's type stripping can't run that shorthand, so scratch files use the long form.
  constructor(repo: OrderRepository, fee: FeeRule) {
    this.repo = repo;
    this.fee = fee;
  }

  quote(id: number): number | undefined {
    const order = this.repo.byId(id);
    return order
      ? order.totalSantim + this.fee(order.area, order.totalSantim)
      : undefined;
  }
}

// A plain object satisfies OrderRepository: no class needed (this is how tests fake it)
const orders: Order[] = [
  { id: 17, area: "Bole", totalSantim: 32000, status: "PENDING" },
  { id: 18, area: "Piassa", totalSantim: 60000, status: "PREPARING" },
];
const fakeRepo: OrderRepository = {
  byId: (id) => orders.find((o) => o.id === id),
};

const byArea: FeeRule = (area, total) =>
  total >= 50000 ? 0 : area === "Bole" ? 4000 : 6000;
const service = new OrderService(fakeRepo, byArea);

console.log(service.quote(17));
console.log(service.quote(18));
console.log(service.quote(99));
