"use strict";

const header = document.querySelector("#site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const navLinks = [...document.querySelectorAll(".nav-link")];
const themeToggle = document.querySelector(".theme-toggle");
const backToTop = document.querySelector(".back-to-top");
const sections = [...document.querySelectorAll("main section[id]")];

// Keep the mobile navigation and its accessibility state synchronized.
function closeMenu() {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const willOpen = !mainNav.classList.contains("open");
  mainNav.classList.toggle("open", willOpen);
  menuToggle.setAttribute("aria-expanded", String(willOpen));
  menuToggle.setAttribute("aria-label", willOpen ? "Close navigation menu" : "Open navigation menu");
  document.body.classList.toggle("menu-open", willOpen);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.addEventListener("click", (event) => {
  if (mainNav.classList.contains("open") && !mainNav.contains(event.target) && !menuToggle.contains(event.target)) {
    closeMenu();
  }
});

navLinks.forEach((link) => link.addEventListener("click", closeMenu));

// Update sticky-header, active-link, and back-to-top states in one scroll pass.
function updateScrollState() {
  const scrollPosition = window.scrollY;
  header.classList.toggle("scrolled", scrollPosition > 16);
  backToTop.classList.toggle("visible", scrollPosition > 650);

  const activeSection = sections.reduce((current, section) => {
    const sectionTop = section.offsetTop - 150;
    return scrollPosition >= sectionTop ? section.id : current;
  }, "home");

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeSection}`;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 820) closeMenu();
  updateScrollState();
});
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
updateScrollState();

// Respect the visitor's system preference until they explicitly choose a theme.
const savedTheme = localStorage.getItem("portfolio-theme");
const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#15101e" : "#6d28d9");
}

applyTheme(savedTheme || (preferredDark ? "dark" : "light"));
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem("portfolio-theme", nextTheme);
});

// Reveal each element once; reduced-motion users receive static content via CSS.
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.querySelectorAll('.project-links a[href="#"], .social-links a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

// Frontend-only contact validation. No data leaves the browser.
const form = document.querySelector("#contact-form");
const successMessage = document.querySelector("#form-success");
const fields = {
  name: {
    element: document.querySelector("#name"),
    validate: (value) => value.length >= 2,
    message: "Please enter at least 2 characters."
  },
  email: {
    element: document.querySelector("#email"),
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value),
    message: "Please enter a valid email address."
  },
  subject: {
    element: document.querySelector("#subject"),
    validate: (value) => value.length >= 3,
    message: "Please enter a clear subject."
  },
  message: {
    element: document.querySelector("#message"),
    validate: (value) => value.length >= 10,
    message: "Please write a message of at least 10 characters."
  }
};

function validateField(name) {
  const field = fields[name];
  const value = field.element.value.trim();
  const isValid = field.validate(value);
  const error = document.querySelector(`#${name}-error`);
  field.element.classList.toggle("invalid", !isValid);
  field.element.setAttribute("aria-invalid", String(!isValid));
  error.textContent = isValid ? "" : field.message;
  return isValid;
}

Object.entries(fields).forEach(([name, field]) => {
  field.element.addEventListener("blur", () => validateField(name));
  field.element.addEventListener("input", () => {
    successMessage.classList.remove("visible");
    if (field.element.classList.contains("invalid")) validateField(name);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const validity = Object.keys(fields).map(validateField);
  if (!validity.every(Boolean)) {
    Object.values(fields).find((field) => field.element.classList.contains("invalid"))?.element.focus();
    return;
  }

  form.reset();
  Object.values(fields).forEach((field) => field.element.removeAttribute("aria-invalid"));
  successMessage.classList.add("visible");
});
