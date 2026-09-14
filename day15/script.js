const btn = document.querySelector(".btn");

btn.addEventListener("mouseenter", () => {
  const angle = Math.random() * Math.PI * 2;
  const distance = 50 + Math.random() * 100;

  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  btn.style.transform = `translate(${x}px, ${y}px)`;
});
