# 🌀 MyGit CLI

**MyGit** is a simplified version control system inspired by Git. It's a custom CLI tool built with **Node.js** and **Commander.js**, allowing you to initialize repositories, stage and commit changes, check logs, and manage versions easily.


## 📦 Project Setup

Follow these steps to set up and use the tool:

### 1. Remove `node_modules` (if needed)

```bash
rm -rf node_modules
````

### 2. Install project dependencies

```bash
npm install
```

### 3. Navigate to your project folder

```bash
cd path/to/your-project
```

### 4. Initialize a MyGit repository

```bash
node app.js init
```

---

## 🚀 Available Commands

Below are the commands supported by the **MyGit CLI**:

### 🧱 Initialize Repository

```bash
node app.js init
```

Creates a new `.mygit` folder to track your project.

---

### ➕ Add a File to Staging Area

```bash
node app.js add <filename>
```

Stages a file for commit.

---

### ✅ Commit Changes

```bash
node app.js commit -m "Your commit message"
```

Creates a commit with a descriptive message.

---

### 📜 View Commit History

```bash
node app.js log
```

Displays the list of previous commits.

---

### 📋 Show Status

```bash
node app.js status
```

Shows current state: staged files, modified files, etc.

---

### 🧭 Checkout to a Specific Commit

```bash
node app.js checkout <commitId>
```

Restores your working directory to a previous commit.

---

## 📁 Project Structure

```
.
├── app.js          # CLI command definitions
├── git.js          # Core logic for Git-like operations
├── package.json    # Project metadata and dependencies
└── README.md       # Project instructions and documentation
```

---

## 📦 Dependencies

* [commander](https://www.npmjs.com/package/commander)

Install via:

```bash
npm install commander
```

---

## 🛠 Requirements

* Node.js v14+
* npm (Node Package Manager)

---

## 🪪 License

This project is open-source and available under the **MIT License**.

---

