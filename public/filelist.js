async function loadFiles() {
  const res = await fetch("/files")

  const data = await res.json();

  const container = document.getElementById("files");
  container.innerHTML = "";

  for (const category in data) {
    const section = document.createElement("div");
    section.className = "mb-4";

    section.innerHTML = `
      <h3 class="font-semibold capitalize mb-1">${category}</h3>
      <ul class="list-disc ml-6">
        ${data[category].map(f => `<li>${f}</li>`).join("")}
      </ul>
    `;

    container.appendChild(section);
  }
}

loadFiles();
