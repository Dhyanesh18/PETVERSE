#!/usr/bin/env node
/**
 * migrateImagesToCloudinary.js
 *
 * 1. Uploads every image from frontend/public/images/ to Cloudinary
 *    under the "petverse/" folder, preserving sub-folder structure.
 * 2. Replaces every hardcoded /images/... path in .jsx, .ejs, .js, .css
 *    files with the corresponding Cloudinary secure URL.
 *
 * Usage (from project root):
 *   node backend/scripts/migrateImagesToCloudinary.js
 *
 * Add --dry-run to preview replacements without writing files.
 */

const path = require('path');
const fs   = require('fs');

// Load backend .env so Cloudinary credentials are available
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Paths ──────────────────────────────────────────────────────────────────
const PROJECT_ROOT  = path.join(__dirname, '../..');
const IMAGES_DIR    = path.join(PROJECT_ROOT, 'frontend/public/images');
const REPLACE_DIRS  = [
    path.join(PROJECT_ROOT, 'frontend/src'),
    path.join(PROJECT_ROOT, 'frontend/views'),
];

const IMAGE_EXTS   = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico']);
const REPLACE_EXTS = new Set(['.jsx', '.js', '.ejs', '.css', '.html']);
const CLOUDINARY_FOLDER = 'petverse';
const DRY_RUN = process.argv.includes('--dry-run');

// ── Helpers ────────────────────────────────────────────────────────────────

/** Recursively collect files under `dir` that match `extSet` (or all if null). */
function walkDir(dir, extSet = null) {
    const results = [];
    if (!fs.existsSync(dir)) return results;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(full, extSet));
        } else if (!extSet || extSet.has(path.extname(entry.name).toLowerCase())) {
            results.push(full);
        }
    }
    return results;
}

/** Convert absolute image path → Cloudinary public_id (no extension). */
function toPublicId(filePath) {
    const rel = path.relative(IMAGES_DIR, filePath).replace(/\\/g, '/');
    const withoutExt = rel.replace(/\.[^.]+$/, '');
    return `${CLOUDINARY_FOLDER}/${withoutExt}`;
}

/** Convert absolute image path → the /images/... path used in source code. */
function toCodePath(filePath) {
    return '/images/' + path.relative(IMAGES_DIR, filePath).replace(/\\/g, '/');
}

// ── Step 1: Upload ─────────────────────────────────────────────────────────

async function uploadImages() {
    const images = walkDir(IMAGES_DIR, IMAGE_EXTS);
    console.log(`Found ${images.length} images under frontend/public/images/\n`);

    const urlMap = {}; // "/images/foo.jpg" → "https://res.cloudinary.com/..."
    let uploaded = 0, skipped = 0, failed = 0;

    for (const imgPath of images) {
        const publicId  = toPublicId(imgPath);
        const codePath  = toCodePath(imgPath);

        if (DRY_RUN) {
            urlMap[codePath] = `[DRY-RUN: https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}]`;
            continue;
        }

        try {
            const result = await cloudinary.uploader.upload(imgPath, {
                public_id:       publicId,
                overwrite:       true,
                use_filename:    false,
                resource_type:   'image',
            });
            urlMap[codePath] = result.secure_url;
            uploaded++;
            process.stdout.write(`  ✓ ${codePath}\n`);
        } catch (err) {
            failed++;
            console.error(`  ✗ ${codePath}: ${err.message || JSON.stringify(err)}`);
        }
    }

    if (!DRY_RUN) {
        console.log(`\nUpload complete — ${uploaded} uploaded, ${skipped} skipped, ${failed} failed.`);
    }
    return urlMap;
}

// ── Step 2: Replace ────────────────────────────────────────────────────────

function replaceInFiles(urlMap) {
    // Sort longest path first so "/images/services/service1.jpg" is replaced
    // before a hypothetical "/images/services/" prefix match.
    const sortedEntries = Object.entries(urlMap).sort(
        ([a], [b]) => b.length - a.length
    );

    let sourceFiles = [];
    for (const dir of REPLACE_DIRS) {
        sourceFiles.push(...walkDir(dir, REPLACE_EXTS));
    }

    console.log(`\nScanning ${sourceFiles.length} source files for replacements...\n`);

    let filesChanged = 0, totalReplacements = 0;

    for (const file of sourceFiles) {
        const original = fs.readFileSync(file, 'utf8');
        let content = original;

        let fileCount = 0;
        for (const [codePath, cloudUrl] of sortedEntries) {
            const occurrences = (content.split(codePath).length - 1);
            if (occurrences > 0) {
                content = content.split(codePath).join(cloudUrl);
                fileCount += occurrences;
            }
        }

        if (content !== original) {
            if (!DRY_RUN) {
                fs.writeFileSync(file, content, 'utf8');
            }
            const relFile = path.relative(PROJECT_ROOT, file);
            console.log(`  ${DRY_RUN ? '[DRY-RUN] ' : ''}✓ ${relFile} — ${fileCount} replacement(s)`);
            filesChanged++;
            totalReplacements += fileCount;
        }
    }

    console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}Done! ${totalReplacements} replacements across ${filesChanged} file(s).`);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   PetVerse — Migrate Images to Cloudinary        ║');
    console.log(`╚══════════════════════════════════════════════════╝`);
    if (DRY_RUN) console.log('\n⚠  DRY-RUN mode — no files will be written.\n');

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        console.error('\nERROR: Cloudinary credentials missing. Check backend/.env');
        process.exit(1);
    }

    console.log(`Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);

    // Step 1 – Upload
    console.log('── Step 1: Uploading images to Cloudinary ──────────\n');
    const urlMap = await uploadImages();

    // Save URL map next to this script for reference / rollback
    const mapPath = path.join(__dirname, 'cloudinary-url-map.json');
    fs.writeFileSync(mapPath, JSON.stringify(urlMap, null, 2));
    console.log(`\nURL map saved → ${mapPath}`);

    // Step 2 – Replace
    console.log('\n── Step 2: Replacing paths in source files ─────────');
    replaceInFiles(urlMap);

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║   Migration complete ✓                           ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
}

main().catch(err => {
    console.error('\nFatal:', err);
    process.exit(1);
});
