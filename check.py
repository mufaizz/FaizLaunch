import os
import json

ROOT = "/workspaces/FaizLaunch"
PASS = "✅"
FAIL = "❌"
WARN = "⚠️"

results = []

def check(label, condition, fix=""):
    status = PASS if condition else FAIL
    results.append((status, label, fix))
    print(f"{status} {label}" + (f"\n   FIX: {fix}" if not condition and fix else ""))

print("\n🔍 FAIZLAUNCH HEALTH CHECK\n" + "="*40)

# ── CORE FILES ──
print("\n📁 CORE FILES")
check("package.json", os.path.exists(f"{ROOT}/package.json"))
check("tsconfig.json", os.path.exists(f"{ROOT}/tsconfig.json"))
check("tsconfig.main.json", os.path.exists(f"{ROOT}/tsconfig.main.json"))
check("vite.config.ts", os.path.exists(f"{ROOT}/vite.config.ts"))
check("electron-builder.yml", os.path.exists(f"{ROOT}/electron-builder.yml"))
check(".gitignore", os.path.exists(f"{ROOT}/.gitignore"))

# ── MAIN PROCESS ──
print("\n⚡ MAIN PROCESS (Electron)")
check("main/main.ts", os.path.exists(f"{ROOT}/main/main.ts"))
check("main/preload.ts", os.path.exists(f"{ROOT}/main/preload.ts"))
check("main/ipc/installer.ts", os.path.exists(f"{ROOT}/main/ipc/installer.ts"))
check("main/ipc/hardware.ts", os.path.exists(f"{ROOT}/main/ipc/hardware.ts"))
check("main/ipc/defender.ts", os.path.exists(f"{ROOT}/main/ipc/defender.ts"))
check("main/ipc/errorAnalyzer.ts", os.path.exists(f"{ROOT}/main/ipc/errorAnalyzer.ts"))

# ── SHARED ──
print("\n🔗 SHARED")
check("shared/types.ts", os.path.exists(f"{ROOT}/shared/types.ts"))

# ── RENDERER ──
print("\n🎨 RENDERER (React UI)")
check("renderer/index.html", os.path.exists(f"{ROOT}/renderer/index.html"))
check("renderer/src/main.tsx", os.path.exists(f"{ROOT}/renderer/src/main.tsx"))
check("renderer/src/App.tsx", os.path.exists(f"{ROOT}/renderer/src/App.tsx"))
check("renderer/src/index.css", os.path.exists(f"{ROOT}/renderer/src/index.css"))
check("renderer/src/mockAPI.ts", os.path.exists(f"{ROOT}/renderer/src/mockAPI.ts"))
check("renderer/src/pages/Home.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Home.tsx"))
check("renderer/src/pages/Installing.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Installing.tsx"))
check("renderer/src/pages/Error.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Error.tsx"))
check("renderer/src/pages/DNA.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/DNA.tsx"))
check("renderer/src/pages/Turbo.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Turbo.tsx"))
check("renderer/src/pages/Library.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Library.tsx"))

# ── NODE MODULES ──
print("\n📦 DEPENDENCIES")
check("node_modules exists", os.path.exists(f"{ROOT}/node_modules"))
check("electron installed", os.path.exists(f"{ROOT}/node_modules/electron"))
check("react installed", os.path.exists(f"{ROOT}/node_modules/react"))
check("vite installed", os.path.exists(f"{ROOT}/node_modules/vite"))
check("typescript installed", os.path.exists(f"{ROOT}/node_modules/typescript"))
check("systeminformation installed", os.path.exists(f"{ROOT}/node_modules/systeminformation"))

# ── PACKAGE.JSON SCRIPTS ──
print("\n🛠️ SCRIPTS")
try:
    with open(f"{ROOT}/package.json") as f:
        pkg = json.load(f)
    scripts = pkg.get("scripts", {})
    check("dev script", "dev" in scripts)
    check("build script", "build" in scripts)
    check("dev:main script", "dev:main" in scripts)
    check("dev:renderer script", "dev:renderer" in scripts)
except:
    check("package.json readable", False, "package.json is corrupted")

# ── SUMMARY ──
passed = sum(1 for r in results if r[0] == PASS)
failed = sum(1 for r in results if r[0] == FAIL)
print(f"\n{'='*40}")
print(f"RESULT: {passed} passed, {failed} failed")
if failed == 0:
    print("🎉 Everything looks good! Run: npm run dev")
else:
    print(f"⚠️  Fix the {failed} missing files above then run: npm run dev")
print("="*40 + "\n")
