import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import readline from "readline-sync"
import fg from 'fast-glob'; 
import { diffLines } from 'diff';

function initRepo() {
    console.log("init repo..");
    const gitDir = path.join(process.cwd() ,  '.mygit')
    if (fs.existsSync(gitDir)) {
        console.log("Repo already initialized.");
        return;
    }

    fs.mkdirSync(gitDir);
    fs.mkdirSync(path.join(gitDir, 'commits'));
    fs.writeFileSync(path.join(gitDir, 'index.json'), JSON.stringify({}));
    fs.writeFileSync(path.join(gitDir, 'HEAD'), '');

    console.log(chalk.green("✅ Initialized empty MyGit repository."));
}

function addFile(filename) {
    const filePath = path.join(process.cwd(), filename);
  
    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`❌ File ${filename} does not exist.`));
      return;
    }
    const fileContent = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha1').update(fileContent).digest('hex');

    const gitDir = path.join(process.cwd(), '.mygit');
    const indexPath = path.join(gitDir, 'index.json');

    if (!fs.existsSync(gitDir)) {
        console.log(chalk.red("❌ Not a MyGit repository. Run 'node app.js init' first."));
        return;
    }

    const index = JSON.parse(fs.readFileSync(indexPath));

    index[filename] = { hash };

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

    console.log(chalk.green(`✅ Added ${filename} to staging area.`));
}
function commitChanges(message) {
    const gitDir = path.join(process.cwd(), '.mygit');
    const indexPath = path.join(gitDir, 'index.json');
    const headPath = path.join(gitDir, 'HEAD');
    const commitsDir = path.join(gitDir, 'commits');
  
    if (!fs.existsSync(gitDir)) {
      console.log(chalk.red("❌ Not a MyGit repository. Run 'node app.js init' first."));
      return;
    }
  
    const index = JSON.parse(fs.readFileSync(indexPath));
  
    if (Object.keys(index).length === 0) {
      console.log(chalk.yellow("⚠️ Nothing to commit. Staging area is empty."));
      return;
    }
  
    const commitData = {
      message,
      timestamp: new Date().toISOString(),
      files: index
    };
  
    // Create commit ID based on commit data
    const commitString = JSON.stringify(commitData);
    const commitId = crypto.createHash('sha1').update(commitString).digest('hex');
  
    // Save commit
    fs.writeFileSync(path.join(commitsDir, `${commitId}.json`), JSON.stringify(commitData, null, 2));
  
    // Update HEAD
    fs.writeFileSync(headPath, commitId);
  
    // Clear staging area
    fs.writeFileSync(indexPath, JSON.stringify({}));
  
    console.log(chalk.green(`✅ Committed as ${commitId.substring(0, 7)} - "${message}"`));
}

function showLogs() {
const gitDir = path.join(process.cwd(), '.mygit');
const commitsDir = path.join(gitDir, 'commits');

if (!fs.existsSync(gitDir)) {
    console.log(chalk.red("❌ Not a MyGit repository. Run 'node app.js init' first."));
    return;
}

const commitFiles = fs.readdirSync(commitsDir);

if (commitFiles.length === 0) {
    console.log(chalk.yellow("ℹ️ No commits found."));
    return;
}

const commits = commitFiles
    .map(file => {
    const commitPath = path.join(commitsDir, file);
    const data = JSON.parse(fs.readFileSync(commitPath));
    return {
        id: file.replace('.json', ''),
        message: data.message,
        timestamp: data.timestamp
    };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // newest first

console.log(chalk.blue.bold("\n📜 Commit History:\n"));
commits.forEach(commit => {
    console.log(chalk.green(`Commit: ${commit.id.substring(0, 7)}`));
    console.log(`Message: ${commit.message}`);
    console.log(`Date:    ${commit.timestamp}`);
    console.log(chalk.gray('---------------------------'));
});
}

function getFileHash(filePath) {
const content = fs.readFileSync(filePath);
return crypto.createHash('sha1').update(content).digest('hex');
}
  
function showStatus() {
const cwd = process.cwd();
const gitDir = path.join(cwd, '.mygit');
const indexPath = path.join(gitDir, 'index.json');
const headPath = path.join(gitDir, 'HEAD');
const commitsDir = path.join(gitDir, 'commits');

if (!fs.existsSync(gitDir)) {
    console.log(chalk.red("❌ Not a MyGit repository. Run 'node app.js init' first."));
    return;
}

const staged = JSON.parse(fs.readFileSync(indexPath));
const allFiles = fs.readdirSync(cwd).filter(file => file !== '.mygit' && fs.statSync(file).isFile());

let lastCommitFiles = {};
if (fs.existsSync(headPath)) {
    const headCommitId = fs.readFileSync(headPath, 'utf-8');
    const headCommitPath = path.join(commitsDir, `${headCommitId}.json`);
    if (fs.existsSync(headCommitPath)) {
    const commitData = JSON.parse(fs.readFileSync(headCommitPath));
    lastCommitFiles = commitData.files || {};
    }
}

console.log(chalk.blue.bold("\n📂 MyGit Status\n"));

// Staged
if (Object.keys(staged).length > 0) {
    console.log(chalk.green("✅ Staged for commit:"));
    for (const file in staged) {
    console.log(`  - ${file}`);
    }
} else {
    console.log(chalk.gray("🔹 No files staged for commit."));
}

// Modified
const modified = Object.keys(lastCommitFiles).filter(file => {
    const fullPath = path.join(cwd, file);
    return fs.existsSync(fullPath) && getFileHash(fullPath) !== lastCommitFiles[file].hash;
});

if (modified.length > 0) {
    console.log(chalk.yellow("\n🟡 Modified since last commit:"));
    modified.forEach(file => console.log(`  - ${file}`));
}

// Untracked
const tracked = new Set([...Object.keys(lastCommitFiles), ...Object.keys(staged)]);
const untracked = allFiles.filter(file => !tracked.has(file));

if (untracked.length > 0) {
    console.log(chalk.cyan("\n⚪ Untracked files:"));
    untracked.forEach(file => console.log(`  - ${file}`));
}

console.log();
}

//   function checkout(commitId) {
//     const cwd = process.cwd();
//     const gitDir = path.join(cwd, '.mygit');
//     const commitsDir = path.join(gitDir, 'commits');
//     const headPath = path.join(gitDir, 'HEAD');
  
//     if (!fs.existsSync(gitDir)) {
//       console.log(chalk.red("❌ Not a MyGit repository. Run 'node app.js init' first."));
//       return;
//     }
  
//     const fullCommitFile = fs.readdirSync(commitsDir).find(file => file.startsWith(commitId));
//     if (!fullCommitFile) {
//       console.log(chalk.red(`❌ Commit "${commitId}" not found.`));
//       return;
//     }
  
//     const commitPath = path.join(commitsDir, fullCommitFile);
//     const commitData = JSON.parse(fs.readFileSync(commitPath));
  
//     // Restore each file
//     // for (const [filename, data] of Object.entries(commitData.files)) {
//     //   fs.writeFileSync(path.join(cwd, filename), data.content);
//     //   console.log(chalk.green(`✔ Restored ${filename}`));
//     // }
//     for (const [filename, data] of Object.entries(commitData.files)) {
//         const targetPath = path.join(cwd, filename);
      
//         if (!data || typeof data.content !== 'string') {
//           console.log(chalk.red(`⚠️ Skipping ${filename}: missing content.`));
//           continue;
//         }
      
//         fs.writeFileSync(targetPath, data.content);
//         console.log(chalk.green(`✔ Restored ${filename}`));
//       }
      
  
//     // Update HEAD
//     fs.writeFileSync(headPath, fullCommitFile.replace('.json', ''));
//     console.log(chalk.blue.bold(`\n✅ Checked out to commit ${fullCommitFile.replace('.json', '').slice(0, 7)}\n`));
//   }

//   function checkout(commitId) {
//     const cwd = process.cwd();
//     const gitDir = path.join(cwd, '.mygit');
//     const commitsDir = path.join(gitDir, 'commits');
//     const headPath = path.join(gitDir, 'HEAD');
  
//     if (!fs.existsSync(gitDir)) {
//       console.log(chalk.red("❌ Not a MyGit repo. Run 'node app.js init' first."));
//       return;
//     }
  
//     const fullCommitFile = fs.readdirSync(commitsDir).find(file => file.startsWith(commitId));
//     if (!fullCommitFile) {
//       console.log(chalk.red(`❌ Commit "${commitId}" not found.`));
//       return;
//     }
  
//     const commitPath = path.join(commitsDir, fullCommitFile);
//     const commitData = JSON.parse(fs.readFileSync(commitPath));
  
//     // Step 1: Delete all files in current directory (except .mygit and app.js files)
//     const currentFiles = fs.readdirSync(cwd);
//     for (const file of currentFiles) {
//       if (file === '.mygit' || file === 'app.js' || file === 'node_modules') continue;
//       const filePath = path.join(cwd, file);
//       if (fs.lstatSync(filePath).isFile()) {
//         fs.unlinkSync(filePath);
//       } else {
//         fs.rmSync(filePath, { recursive: true, force: true });
//       }
//       console.log(chalk.yellow(`🗑️ Deleted ${file}`));
//     }
  
//     // Step 2: Restore files from commit
//     for (const [filename, data] of Object.entries(commitData.files)) {
//       const targetPath = path.join(cwd, filename);
  
//       if (!data || typeof data.content !== 'string') {
//         console.log(chalk.red(`⚠️ Skipping ${filename}: missing content.`));
//         continue;
//       }
  
//       fs.writeFileSync(targetPath, data.content);
//       console.log(chalk.green(`✔ Restored ${filename}`));
//     }
  
//     // Step 3: Update HEAD
//     fs.writeFileSync(headPath, fullCommitFile.replace('.json', ''));
//     console.log(chalk.blue.bold(`\n✅ Checked out to commit ${fullCommitFile.replace('.json', '').slice(0, 7)}\n`));
//   }

// function checkout(commitId) {
//     const cwd = process.cwd();
//     const gitDir = path.join(cwd, '.mygit');
//     const commitsDir = path.join(gitDir, 'commits');
//     const headPath = path.join(gitDir, 'HEAD');
  
//     if (!fs.existsSync(gitDir)) {
//       console.log(chalk.red("❌ Not a MyGit repo. Run 'node app.js init' first."));
//       return;
//     }
  
//     const fullCommitFile = fs.readdirSync(commitsDir).find(file => file.startsWith(commitId));
//     if (!fullCommitFile) {
//       console.log(chalk.red(`❌ Commit "${commitId}" not found.`));
//       return;
//     }
  
//     const commitPath = path.join(commitsDir, fullCommitFile);
//     const commitData = JSON.parse(fs.readFileSync(commitPath));
  
//     // Step 1: Restore committed files
//     for (const [filename, data] of Object.entries(commitData.files)) {
//       const targetPath = path.join(cwd, filename);
  
//       if (!data || typeof data.content !== 'string') {
//         console.log(chalk.red(`⚠️ Skipping ${filename}: missing content.`));
//         continue;
//       }
  
//       // Ensure folder structure exists (important if file inside folder)
//       const dir = path.dirname(targetPath);
//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//       }
  
//       fs.writeFileSync(targetPath, data.content);
//       console.log(chalk.green(`✔ Restored ${filename}`));
//     }
  
//     // Step 2: Update HEAD
//     fs.writeFileSync(headPath, fullCommitFile.replace('.json', ''));
//     console.log(chalk.blue.bold(`\n✅ Checked out to commit ${fullCommitFile.replace('.json', '').slice(0, 7)}\n`));
//   }

function checkout(commitId) {
    const cwd = process.cwd();
    const gitDir = path.join(cwd, '.mygit');
    const commitsDir = path.join(gitDir, 'commits');
    const headPath = path.join(gitDir, 'HEAD');
  
    if (!fs.existsSync(gitDir)) {
      console.log(chalk.red("❌ Not a MyGit repo. Run 'node app.js init' first."));
      return;
    }
  
    const fullCommitFile = fs.readdirSync(commitsDir).find(file => file.startsWith(commitId));
    if (!fullCommitFile) {
      console.log(chalk.red(`❌ Commit "${commitId}" not found.`));
      return;
    }
  
    const commitPath = path.join(commitsDir, fullCommitFile);
    const commitData = JSON.parse(fs.readFileSync(commitPath));
  
    // Step 1: Check and show diffs
    for (const [filename, data] of Object.entries(commitData.files)) {
      const targetPath = path.join(cwd, filename);
  
      if (!data || typeof data.content !== 'string') {
        console.log(chalk.red(`⚠️ Skipping ${filename}: missing content.`));
        continue;
      }
  
      let shouldOverwrite = true;
  
      if (fs.existsSync(targetPath)) {
        const currentContent = fs.readFileSync(targetPath, 'utf-8');
        const currentLines = currentContent.split('\n');
        const committedLines = data.content.split('\n');
  
        let hasDifference = false;
  
        const maxLines = Math.max(currentLines.length, committedLines.length);
        console.log(chalk.yellowBright(`\n📝 Changes in ${filename}:`));
        for (let i = 0; i < maxLines; i++) {
          const currentLine = currentLines[i] ?? '';
          const committedLine = committedLines[i] ?? '';
  
          if (currentLine !== committedLine) {
            hasDifference = true;
            console.log(
              chalk.red(`- ${currentLine}`)
            );
            console.log(
              chalk.green(`+ ${committedLine}`)
            );
          }
        }
  
        if (hasDifference) {
          const answer = readline.question(chalk.cyan(`\nDo you want to overwrite ${filename}? (y/n): `));
          shouldOverwrite = answer.trim().toLowerCase() === 'y';
        } else {
          shouldOverwrite = false; // No difference, no need to overwrite
        }
      }
  
      // Step 2: Overwrite if user allowed
      if (shouldOverwrite) {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, data.content);
        console.log(chalk.green(`✔ Restored ${filename}`));
      } else {
        console.log(chalk.gray(`⏭️ Skipped ${filename}`));
      }
    }
  
    // Step 3: Update HEAD
    fs.writeFileSync(headPath, fullCommitFile.replace('.json', ''));
    console.log(chalk.blue.bold(`\n✅ Checked out to commit ${fullCommitFile.replace('.json', '').slice(0, 7)}\n`));
}
function showDiff(filePath, oldContent, newContent) {
    oldContent = oldContent || '';
    newContent = newContent || '';
    
    const changes = diffLines(oldContent, newContent);
  
    console.log(chalk.bold(`\nChanges in ${filePath}:\n`));
  
    changes.forEach(change => {
      if (change.added) {
        process.stdout.write(chalk.green(`+ ${change.value}`));
      } else if (change.removed) {
        process.stdout.write(chalk.red(`- ${change.value}`));
      } else {
        process.stdout.write(`  ${change.value}`);
      }
    });
  
    console.log("\n" + "-".repeat(40));
}
function status() {
    const cwd = process.cwd();
    const gitDir = path.join(cwd, '.mygit');
    const commitsDir = path.join(gitDir, 'commits');
    const headPath = path.join(gitDir, 'HEAD');
  
    if (!fs.existsSync(gitDir)) {
      console.log(chalk.red("❌ Not a MyGit repo. Run 'node app.js init' first."));
      return;
    }
  
    if (!fs.existsSync(headPath)) {
      console.log(chalk.yellow("⚠️ No commits yet. Nothing to compare."));
      return;
    }
  
    const headCommitId = fs.readFileSync(headPath, 'utf-8').trim();
    const commitPath = path.join(commitsDir, `${headCommitId}.json`);
  
    if (!fs.existsSync(commitPath)) {
      console.log(chalk.red(`❌ HEAD commit ${headCommitId} data not found.`));
      return;
    }
  
    const commitData = JSON.parse(fs.readFileSync(commitPath));
    const committedFiles = commitData.files;
  
    const allFiles = fg.sync(['**/*'], {
      cwd,
      dot: true,
      ignore: ['node_modules/**', '.mygit/**']
    });
  
    const currentFilesMap = {};
  
    for (const file of allFiles) {
      const fullPath = path.join(cwd, file);
      if (fs.lstatSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        currentFilesMap[file] = content;
      }
    }
  
    let hasChanges = false;
  
    console.log(chalk.bold("\n🔎 Checking status...\n"));
  
    // Step 1: Check for modified and deleted files
    for (const [filename, data] of Object.entries(committedFiles)) {
      if (!(filename in currentFilesMap)) {
        console.log(chalk.red(`Deleted: ${filename}`));
        hasChanges = true;
      } else if (currentFilesMap[filename] !== data.content) {
        console.log(chalk.yellow(`Modified: ${filename}`));
        showDiff(filename, data.content, currentFilesMap[filename]); // 👈 Show detailed changes
        hasChanges = true;
      }
    }
  
    // Step 2: Check for untracked files
    for (const filename of Object.keys(currentFilesMap)) {
      if (!(filename in committedFiles)) {
        console.log(chalk.blue(`Untracked: ${filename}`));
        hasChanges = true;
      }
    }
  
    if (!hasChanges) {
      console.log(chalk.green("✅ Working directory clean."));
    }
}


  
export {initRepo,addFile,commitChanges ,showLogs,showStatus,checkout,status};