
### 1. Git for Windows

Go to the official page:  
**https://git-scm.com/download/win**
### 2. Run the Installer
Double-click the `.exe` file.
### 3. Installer Options (just pick the correct ones)
Go through the steps like this:
1. **Select Components** → Leave everything as default.
2. **Editor** → Choose _Nano_ or _VS Code_ (most people pick VS Code).
3. **PATH Environment** → Choose **“Git from the command line and also from 3rd-party software”**
4. **HTTPS Backend** → Choose **“Use HTTPS”**.
5. **Line Endings** → Choose **“Checkout Windows-style, commit Unix-style”**.
6. **Terminal Emulator** → Pick **“Use Windows’ default console (cmd.exe)”** unless you prefer MinTTY.
7. **Default Behavior for Git Pull** → Choose **“Fast-forward or merge”**.
8. Continue clicking **Next** until **Install**.

### 4. Finish Installation
Click **Finish** and optionally run Git Bash immediately.
### 5. Verify Installation
Open **Command Prompt**, **PowerShell**, or **Git Bash**, and run:

``` sh
git --version
```
``` sh
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

## **1. Install Node.js (LTS)**

Go to:
**[https://nodejs.org](https://nodejs.org)**
Download the **LTS** version (not the Current one).  
Run the installer → keep all defaults.
This installs:
- **Node.js**
- **npm** (Node Package Manager)
---
## **2. Verify the Installation**
Open **PowerShell** or **Command Prompt**:
``` sh
node -v
npm -v
```
## **3. Install a Package Manager Manager (Optional but useful)**
Yarn or pnpm can speed things up, but npm is enough.  
If you want Yarn:
``` sh
npm install --global yarn
```
``` sh
npm install --global pnpm
```
## **4. Create a React App (Modern setup)**
### **Vite**
``` sh
npm create vite@latest my-react-app --template react
cd my-react-app
npm install
npm run dev
```

## **5. (Optional) Install VS Code Extensions**
If you use VS Code, install:
- **ES7+ React/Redux/React-Native snippets**
- **Prettier**
- **ESLint**
- **Tailwind CSS IntelliSense** (if you’ll use Tailwind)
## **6. (Optional) Set PATH Environment (if needed)**
If `node` or `npm` don’t work, add this to PATH:
``` 
C:\Program Files\nodejs\
```
## **1. Install Rust (rustup)**

Go to the official installer:  
**[https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)**

Download **rustup-init.exe** and run it.
When asked:
- Choose **1) Proceed with installation (default)**.
This installs:
- **rustup** (Rust toolchain manager)
- **cargo** (Rust package manager/build tool)
- **rustc** (Rust compiler)
---
## **2. Restart Your Terminal**
Close and reopen PowerShell or Command Prompt so PATH updates.

---
## **3. Verify Installation**
Run:
``` sh
rustc --version
cargo --version
rustup --version
```
If all 3 print versions, you’re set.

---
## **4. Install the Recommended Toolchain (Stable)**
Should already be installed, but confirm:
``` sh
rustup default stable
```
## **5. Add the Build Tools for Windows**
Rust needs the Windows C++ build tools for compiling native crates.
**Option A — Install MSVC Build Tools (recommended)**  
Go here:  
[https://visualstudio.microsoft.com/visual-cpp-build-tools/](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
Install:
- **Desktop development with C++**
- Keep defaults
**Option B — Install full Visual Studio (not needed unless you're doing C++)**

## **6. Create Your First Rust Project**
``` sh
cargo new my_app
cd my_app
cargo run
```
## **7. Optional (but useful) Tools**
### VS Code Extensions:
- **rust-analyzer** (this is the main one)
- **Even Better TOML**

