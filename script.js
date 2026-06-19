const stages = [
  {
    label: "Stage 1",
    title: "Prototype the core loop.",
    body:
      "Consultation input, Arabic/Gulf note generation, uncertainty scoring, clinician checkpoints, privacy options, patient-friendly Arabic instructions, and basic RAG over selected references.",
  },
  {
    label: "Stage 2",
    title: "Fit the outpatient workflow.",
    body:
      "Telehealth support, pre-consultation intake, triage summaries, structured pre-visit notes, and deeper RAG over local clinic documents and approved guidelines.",
  },
  {
    label: "Stage 3",
    title: "Build local healthcare intelligence.",
    body:
      "Qatar-specific knowledge bases, public health documents, institutional policies, clinical research, workflow analytics, and intelligent support beyond documentation.",
  },
];

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const stageButtons = document.querySelectorAll(".stage-tab");
const stageContent = document.querySelector(".stage-content");

stageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextStage = stages[Number(button.dataset.stage)];
    stageButtons.forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-selected", "true");

    if (stageContent && nextStage) {
      stageContent.animate(
        [
          { opacity: 0, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 260, easing: "ease-out" }
      );
      stageContent.innerHTML = `
        <p class="stage-label">${nextStage.label}</p>
        <h2>${nextStage.title}</h2>
        <p>${nextStage.body}</p>
      `;
    }
  });
});

const canvas = document.getElementById("signalCanvas");
const context = canvas?.getContext("2d");
let frame = 0;

function fitCanvas() {
  if (!canvas || !context) return;
  const ratio = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
  canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawSignal() {
  if (!canvas || !context) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const centerY = height * 0.48;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#070707";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255,255,255,0.06)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 42) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y < height; y += 42) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const paths = [
    { color: "rgba(255,255,255,0.82)", amp: 30, speed: 0.024, offset: 0 },
    { color: "rgba(255,155,199,0.78)", amp: 22, speed: 0.034, offset: 1.8 },
    { color: "rgba(201,176,255,0.55)", amp: 16, speed: 0.047, offset: 3.1 },
  ];

  paths.forEach((path, index) => {
    context.beginPath();
    context.strokeStyle = path.color;
    context.lineWidth = index === 0 ? 2 : 1.4;
    for (let x = 0; x <= width; x += 5) {
      const wave =
        Math.sin(x * path.speed + frame * 0.035 + path.offset) * path.amp +
        Math.sin(x * 0.011 + frame * 0.018) * 12;
      const y = centerY + wave + (index - 1) * 42;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  });

  const nodes = [
    [0.18, 0.28, "speech"],
    [0.42, 0.64, "note"],
    [0.64, 0.33, "RAG"],
    [0.82, 0.55, "ask"],
  ];

  nodes.forEach(([nx, ny, label], index) => {
    const x = width * nx;
    const y = height * ny + Math.sin(frame * 0.025 + index) * 7;
    context.beginPath();
    context.fillStyle = index === 2 ? "rgba(101,24,53,0.92)" : "rgba(251,250,248,0.92)";
    context.arc(x, y, index === 2 ? 7 : 5, 0, Math.PI * 2);
    context.fill();
    context.font = "700 12px Arial";
    context.fillStyle = "rgba(255,255,255,0.58)";
    context.fillText(label, x + 12, y + 4);
  });

  context.fillStyle = "rgba(255,255,255,0.08)";
  context.fillRect(18, height - 58, width - 36, 1);
  context.fillStyle = "rgba(255,155,199,0.85)";
  context.fillRect(18, height - 58, ((frame % 240) / 240) * (width - 36), 1);

  frame += 1;
  window.requestAnimationFrame(drawSignal);
}

if (canvas && context) {
  fitCanvas();
  drawSignal();
  window.addEventListener("resize", fitCanvas);
}
