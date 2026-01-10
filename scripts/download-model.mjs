#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const modelsDir = path.join(projectRoot, 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Model configuration
const MODEL_CONFIG = {
  name: 'en_US-libritts-high',
  onnxUrl: 'https://github.com/rhasspy/piper-voices/releases/download/v1.0.0/en_US-libritts-high.onnx',
  jsonUrl: 'https://github.com/rhasspy/piper-voices/releases/download/v1.0.0/en_US-libritts-high.onnx.json',
  chunkSize: 20 * 1024 * 1024, // 20MB chunks for Cloudflare Workers compatibility
};

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = ((downloadedSize / totalSize) * 100).toFixed(2);
        process.stdout.write(`\rDownloading: ${percent}%`);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\n✓ Download completed');
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

function splitFile(inputPath, outputDir, chunkSize) {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(inputPath).size;
    const totalChunks = Math.ceil(fileSize / chunkSize);
    
    console.log(`\nSplitting file into ${totalChunks} chunks...`);
    
    const readStream = fs.createReadStream(inputPath, { highWaterMark: chunkSize });
    let chunkIndex = 0;
    let currentChunk = Buffer.alloc(0);

    readStream.on('data', (chunk) => {
      currentChunk = Buffer.concat([currentChunk, chunk]);

      while (currentChunk.length >= chunkSize) {
        const chunkData = currentChunk.slice(0, chunkSize);
        currentChunk = currentChunk.slice(chunkSize);

        const chunkPath = path.join(outputDir, `${MODEL_CONFIG.name}.onnx.part${chunkIndex}`);
        fs.writeFileSync(chunkPath, chunkData);
        console.log(`✓ Created chunk ${chunkIndex}: ${(chunkData.length / 1024 / 1024).toFixed(2)}MB`);
        chunkIndex++;
      }
    });

    readStream.on('end', () => {
      if (currentChunk.length > 0) {
        const chunkPath = path.join(outputDir, `${MODEL_CONFIG.name}.onnx.part${chunkIndex}`);
        fs.writeFileSync(chunkPath, currentChunk);
        console.log(`✓ Created chunk ${chunkIndex}: ${(currentChunk.length / 1024 / 1024).toFixed(2)}MB`);
      }
      resolve(chunkIndex + 1);
    });

    readStream.on('error', reject);
  });
}

async function main() {
  try {
    console.log('🎙️ Piper TTS Model Downloader\n');
    console.log(`Model: ${MODEL_CONFIG.name}`);
    console.log(`Output: ${modelsDir}\n`);

    // Download ONNX model
    const onnxPath = path.join(modelsDir, `${MODEL_CONFIG.name}.onnx`);
    if (!fs.existsSync(onnxPath)) {
      console.log('Downloading ONNX model...');
      await downloadFile(MODEL_CONFIG.onnxUrl, onnxPath);
    } else {
      console.log('✓ ONNX model already exists');
    }

    // Download JSON config
    const jsonPath = path.join(modelsDir, `${MODEL_CONFIG.name}.onnx.json`);
    if (!fs.existsSync(jsonPath)) {
      console.log('\nDownloading model config...');
      await downloadFile(MODEL_CONFIG.jsonUrl, jsonPath);
    } else {
      console.log('✓ Model config already exists');
    }

    // Split ONNX file into chunks
    const totalChunks = await splitFile(onnxPath, modelsDir, MODEL_CONFIG.chunkSize);

    // Create manifest file
    const manifest = {
      model: MODEL_CONFIG.name,
      version: '1.0.0',
      chunks: totalChunks,
      chunkSize: MODEL_CONFIG.chunkSize,
      files: [],
    };

    for (let i = 0; i < totalChunks; i++) {
      manifest.files.push(`${MODEL_CONFIG.name}.onnx.part${i}`);
    }

    const manifestPath = path.join(modelsDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n✓ Manifest created: ${manifestPath}`);

    console.log('\n✅ Model setup completed successfully!');
    console.log(`Total chunks: ${totalChunks}`);
    console.log(`Chunk size: ${(MODEL_CONFIG.chunkSize / 1024 / 1024).toFixed(0)}MB`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
