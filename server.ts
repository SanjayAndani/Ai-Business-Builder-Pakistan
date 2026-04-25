import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import * as prettier from "prettier";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for code formatting
  app.post("/api/format", async (req, res) => {
    try {
      const { files } = req.body;
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: "Invalid files array" });
      }

      const formattedFiles = await Promise.all(
        files.map(async (file: any) => {
          if (!file.content) return file;
          try {
            let parser = "";
            const name = file.name.toLowerCase();
            if (name.endsWith(".html")) parser = "html";
            else if (name.endsWith(".css")) parser = "css";
            else if (name.endsWith(".js") || name.endsWith(".jsx")) parser = "babel";
            else if (name.endsWith(".ts") || name.endsWith(".tsx")) parser = "typescript";
            else if (name.endsWith(".json")) parser = "json";

            if (parser) {
              const formattedContent = await prettier.format(file.content, {
                parser,
                semi: true,
                singleQuote: true,
                printWidth: 100,
                trailingComma: "es5",
              });
              return { ...file, content: formattedContent };
            }
          } catch (e) {
            console.warn(`Prettier failed to format ${file.name} on server:`, e);
          }
          return file;
        })
      );

      res.json({ files: formattedFiles });
    } catch (error: any) {
      console.error("Formatting error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
