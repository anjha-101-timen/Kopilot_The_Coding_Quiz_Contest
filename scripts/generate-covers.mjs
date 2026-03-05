import fs from "node:fs";
import path from "node:path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in environment.");
  process.exit(1);
}

const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, "assets", "covers");

fs.mkdirSync(OUT_DIR, { recursive: true });

const items = [
  {
    out: "branches-ai.png",
    prompt:
      "Premium futuristic poster cover for Artificial Intelligence: glowing neural network brain, holographic circuits, deep violet to electric blue gradient, cinematic lighting, minimal, modern, ultra high quality, no text",
  },
  {
    out: "branches-ml.png",
    prompt:
      "Premium futuristic poster cover for Machine Learning: abstract data points, model graph lines, gradient teal to blue, clean tech aesthetic, cinematic lighting, minimal, ultra high quality, no text",
  },
  {
    out: "branches-dl.png",
    prompt:
      "Premium futuristic poster cover for Deep Learning: transformer-like layered blocks, glowing nodes, magenta to purple to blue gradient, cinematic lighting, minimal, ultra high quality, no text",
  },
  {
    out: "branches-datascience.png",
    prompt:
      "Premium futuristic poster cover for Data Science: floating charts, clean dashboards, emerald and cyan glow, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-fullstack.png",
    prompt:
      "Premium futuristic poster cover for Full Stack Web Development: browser UI silhouettes, server racks, API nodes, orange to blue gradient, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-devops.png",
    prompt:
      "Premium futuristic poster cover for DevOps: CI/CD pipeline flow, containers, cloud nodes, green to blue gradient, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-cloud.png",
    prompt:
      "Premium futuristic poster cover for Cloud Computing: cloud icon made of particles, network lines, sky blue and indigo gradient, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-cybersecurity.png",
    prompt:
      "Premium futuristic poster cover for Cybersecurity: shield silhouette, binary patterns, red accents on dark blue, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-mobile.png",
    prompt:
      "Premium futuristic poster cover for Mobile App Development: glowing smartphone outline, UI cards, pink to orange gradient with blue highlights, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-blockchain.png",
    prompt:
      "Premium futuristic poster cover for Blockchain and Web3: hexagon network, glowing chain links, purple to teal gradient, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-iot.png",
    prompt:
      "Premium futuristic poster cover for IoT and Embedded Systems: sensors and microchip silhouette, network waves, green and gold accents, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-systems.png",
    prompt:
      "Premium futuristic poster cover for Systems and OS: terminal grid, performance traces, steel gray and blue glow, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-dsa.png",
    prompt:
      "Premium futuristic poster cover for Data Structures and Algorithms: abstract nodes and edges, clean geometry, gold and orange highlights on dark background, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-backend.png",
    prompt:
      "Premium futuristic poster cover for Backend Engineering: API nodes, database cylinder, cache layers, blue and green glow, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-uiux.png",
    prompt:
      "Premium futuristic poster cover for UI UX Design: modern design system components, grids, soft neon highlights, pink and violet gradient, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-db.png",
    prompt:
      "Premium futuristic poster cover for Databases and SQL: database cylinder with query lines, teal and blue glow, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-game.png",
    prompt:
      "Premium futuristic poster cover for Game Development: controller silhouette, particle effects, orange and purple neon, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "branches-qa.png",
    prompt:
      "Premium futuristic poster cover for Testing and QA Automation: checkmarks, test pipeline lines, green and blue glow, minimal, cinematic lighting, ultra high quality, no text",
  },
  {
    out: "testseries-pro.png",
    prompt:
      "Premium futuristic poster cover for elite coding practice pro series: trophy glow, leaderboard streak lines, red magenta violet neon, cinematic lighting, minimal, ultra high quality, no text",
  },
  {
    out: "testseries-club.png",
    prompt:
      "Premium futuristic poster cover for developers club: community nodes, collaboration glow, blue teal gradient, cinematic lighting, minimal, ultra high quality, no text",
  },
  {
    out: "testseries-core.png",
    prompt:
      "Premium futuristic poster cover for code foundations: clean code brackets, circuit lines, gold orange highlights, cinematic lighting, minimal, ultra high quality, no text",
  },
  {
    out: "testseries-sprint.png",
    prompt:
      "Premium futuristic poster cover for logic and speed sprint: stopwatch glow, motion streaks, green and yellow neon, cinematic lighting, minimal, ultra high quality, no text",
  },
  {
    out: "testseries-mock.png",
    prompt:
      "Premium futuristic poster cover for full mock league: arena lights, analytics graph glow, blue indigo gradient, cinematic lighting, minimal, ultra high quality, no text",
  },
];

async function generatePngBase64(prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE || "1024x576",
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Image generation failed: ${res.status} ${res.statusText}\n${t}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No b64_json returned from API.");
  return b64;
}

async function main() {
  console.log(`Output directory: ${OUT_DIR}`);
  console.log(`Items: ${items.length}`);

  for (const it of items) {
    const outPath = path.join(OUT_DIR, it.out);
    if (fs.existsSync(outPath) && process.env.OVERWRITE !== "1") {
      console.log(`Skip (exists): ${it.out}`);
      continue;
    }

    console.log(`Generating: ${it.out}`);
    const b64 = await generatePngBase64(it.prompt);
    const buf = Buffer.from(b64, "base64");
    fs.writeFileSync(outPath, buf);
    console.log(`Saved: ${it.out} (${buf.byteLength} bytes)`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
