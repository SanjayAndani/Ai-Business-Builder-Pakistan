import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import * as prettier from 'prettier';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;
  const isProduction = process.env.NODE_ENV === 'production';

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  app.use(express.json({ limit: '10mb' }));

  app.post('/api/generate', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Missing GEMINI_API_KEY on server',
        });
      }

      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Prompt is required',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({
        text: response.text,
      });
    } catch (error: any) {
      console.error('Gemini API error:', error);

      return res.status(500).json({
        error: error.message || 'Gemini request failed',
      });
    }
  });

  app.post('/api/format', async (req, res) => {
    try {
      const { files } = req.body;

      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Invalid files array' });
      }

      const formattedFiles = await Promise.all(
        files.map(async (file: any) => {
          if (!file?.content || !file?.name) return file;

          try {
            let parser: prettier.BuiltInParserName | '' = '';
            const name = file.name.toLowerCase();

            if (name.endsWith('.html')) parser = 'html';
            else if (name.endsWith('.css')) parser = 'css';
            else if (name.endsWith('.js') || name.endsWith('.jsx')) parser = 'babel';
            else if (name.endsWith('.ts') || name.endsWith('.tsx')) parser = 'typescript';
            else if (name.endsWith('.json')) parser = 'json';

            if (!parser) return file;

            const formattedContent = await prettier.format(file.content, {
              parser,
              semi: true,
              singleQuote: true,
              printWidth: 100,
              trailingComma: 'es5',
            });

            return { ...file, content: formattedContent };
          } catch (error) {
            console.warn(`Prettier failed to format ${file.name}:`, error);
            return file;
          }
        })
      );

      return res.json({ files: formattedFiles });
    } catch (error: any) {
      console.error('Formatting error:', error);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});