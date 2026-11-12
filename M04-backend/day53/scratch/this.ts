export {};

class Kitchen {
  area = "Bole";

  feeMethod() {
    return this.area === "Bole" ? 4000 : 6000;
  }

  feeArrow = () => (this.area === "Bole" ? 4000 : 6000);
}

const k = new Kitchen();
console.log(k.feeMethod(), k.feeArrow());

const arrow = k.feeArrow;
console.log("detached arrow:", arrow());

const bound = k.feeMethod.bind(k);
console.log("bound method", bound());

const method = k.feeMethod;
console.log("detach method:", method());
