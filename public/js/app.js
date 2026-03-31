const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
const flash = document.querySelector("[data-flash]");

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    menu.classList.toggle("is-open");
  });
}

if (flash) {
  window.setTimeout(() => {
    flash.style.opacity = "0";
    flash.style.transform = "translateY(-8px)";
    flash.style.transition = "opacity 200ms ease, transform 200ms ease";
  }, 3200);
}
