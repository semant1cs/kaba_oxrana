const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function runPythonDetector(imagePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "detect_glasses.py");
    const python = spawn("python3", [scriptPath, imagePath]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", data => {
      stdout += data.toString();
    });

    python.stderr.on("data", data => {
      stderr += data.toString();
    });

    python.on("close", code => {
      if (code !== 0) {
        return reject(new Error(stderr || `Python exited with code ${code}`));
      }
      const trimmed = stdout.trim();
      if (trimmed === "1") {
        resolve(true);
      } else if (trimmed === "0") {
        resolve(false);
      } else {
        reject(new Error(`Unexpected python output: ${trimmed}`));
      }
    });
  });
}

async function detectGlasses(imageBuffer) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "discord-verif-"));
  const imagePath = path.join(tmpDir, "image.jpg");

  await fs.promises.writeFile(imagePath, imageBuffer);

  try {
    const result = await runPythonDetector(imagePath);
    return result;
  } catch (error) {
    console.error(error);
    return true;
  } finally {
    fs.rm(imagePath, { force: true }, () => {});
    fs.rm(tmpDir, { recursive: true, force: true }, () => {});
  }
}

module.exports = { detectGlasses };

