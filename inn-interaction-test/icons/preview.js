"use strict";
for (const [id, className] of [["grayBtn", "gray"], ["darkBtn", "dark"]]) {
  const button = document.getElementById(id);
  button.addEventListener("click", () => {
    const pressed = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(pressed));
    document.body.classList.toggle(className, pressed);
  });
}
