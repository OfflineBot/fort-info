// Progress tracking + interactivity for the learning site.
// Pure client-side, persists to localStorage.

const STORAGE_KEY = "fortinfo-progress";

// Total exercises across the whole site: 12 Moodle-Aufgaben + 15 Bonus = 27.
const TOTAL_EXERCISES = 27;

document.addEventListener("DOMContentLoaded", () => {
  if (window.hljs) window.hljs.highlightAll();

  // Active-page highlight in sidebar
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("#sidebar nav a").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
    if (href === current || (current === "" && href === "index.html")) {
      a.classList.add("current");
      // Auto-open the parent <details> if any
      const det = a.closest("details");
      if (det) det.open = true;
    }
  });

  const exercises = Array.from(document.querySelectorAll(".exercise"));
  document.getElementById("progress-total").textContent = TOTAL_EXERCISES;

  const state = load();

  exercises.forEach((ex) => {
    const id = ex.dataset.id;
    if (state[id]) ex.classList.add("done");

    // Click on the ::before checkbox area
    ex.addEventListener("click", (e) => {
      const rect = ex.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // checkbox lives in top-right ~22x22 starting at 1rem
      if (x > rect.width - 50 && y < 50) {
        ex.classList.toggle("done");
        state[id] = ex.classList.contains("done");
        save(state);
        updateProgress();
      }
    });

    const showBtn = ex.querySelector(".show");
    const solution = ex.querySelector(".solution");
    if (showBtn && solution) {
      showBtn.addEventListener("click", () => {
        solution.classList.toggle("open");
        showBtn.textContent = solution.classList.contains("open")
          ? "Lösung verbergen"
          : "Lösung zeigen";
      });
    }
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("Allen Fortschritt zurücksetzen?")) return;
    localStorage.removeItem(STORAGE_KEY);
    exercises.forEach((ex) => ex.classList.remove("done"));
    updateProgress();
  });

  document.querySelectorAll("ul.checklist li").forEach((li, i) => {
    const key = "ck-" + i;
    if (state[key]) li.classList.add("checked");
    li.addEventListener("click", () => {
      li.classList.toggle("checked");
      state[key] = li.classList.contains("checked");
      save(state);
    });
  });

  // Prompt boxes — fill template with input values, live update
  document.querySelectorAll(".prompt-box").forEach((box) => {
    const tpl    = box.dataset.template || "";
    const pre    = box.querySelector("pre");
    const inputs = Array.from(box.querySelectorAll("[data-var]"));
    const render = () => {
      let out = tpl;
      inputs.forEach((i) => {
        const re = new RegExp("\\{" + i.dataset.var + "\\}", "g");
        out = out.replace(re, i.value);
      });
      if (pre) pre.textContent = out;
    };
    inputs.forEach((i) => i.addEventListener("input", render));
    render();
  });

  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.target;
      const text = document.getElementById(id).innerText;
      try {
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = "Kopiert!";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove("copied");
        }, 1500);
      } catch (err) {
        alert("Kopieren fehlgeschlagen — bitte manuell auswählen.");
      }
    });
  });

  updateProgress();
});

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateProgress() {
  // Count *all* completed exercises across the site from localStorage,
  // not just the ones rendered on this page.
  const state = load();
  let done = 0;
  for (const k in state) {
    if (k.startsWith("aufg") && state[k] === true) done++;
  }
  document.getElementById("progress-done").textContent = done;
  document.getElementById("progress-fill").style.width =
    TOTAL_EXERCISES === 0 ? "0%" : Math.round((done / TOTAL_EXERCISES) * 100) + "%";
}
