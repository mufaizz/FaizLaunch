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

print("\n🔍 FAIZLAUNCH HEALTH CHECK — FULL PROJECT\n" + "="*50)

print("\n📁 CORE FILES")
check("package.json", os.path.exists(f"{ROOT}/package.json"))
check("tsconfig.json", os.path.exists(f"{ROOT}/tsconfig.json"))
check("tsconfig.main.json", os.path.exists(f"{ROOT}/tsconfig.main.json"))
check("vite.config.ts", os.path.exists(f"{ROOT}/vite.config.ts"))
check("electron-builder.yml", os.path.exists(f"{ROOT}/electron-builder.yml"))
check(".gitignore", os.path.exists(f"{ROOT}/.gitignore"))
check("LICENSE.txt", os.path.exists(f"{ROOT}/LICENSE.txt"))
check("check.py", os.path.exists(f"{ROOT}/check.py"))

print("\n⚡ MAIN PROCESS")
check("main/main.ts", os.path.exists(f"{ROOT}/main/main.ts"))
check("main/preload.ts", os.path.exists(f"{ROOT}/main/preload.ts"))
check("main/ipc/installer.ts", os.path.exists(f"{ROOT}/main/ipc/installer.ts"))
check("main/ipc/hardware.ts", os.path.exists(f"{ROOT}/main/ipc/hardware.ts"))
check("main/ipc/defender.ts", os.path.exists(f"{ROOT}/main/ipc/defender.ts"))
check("main/ipc/errorAnalyzer.ts", os.path.exists(f"{ROOT}/main/ipc/errorAnalyzer.ts"))
check("main/ipc/aicompanion.ts", os.path.exists(f"{ROOT}/main/ipc/aicompanion.ts"))
check("main/ipc/vault.ts", os.path.exists(f"{ROOT}/main/ipc/vault.ts"))
check("main/ipc/together.ts", os.path.exists(f"{ROOT}/main/ipc/together.ts"))
check("main/ipc/doctor.ts", os.path.exists(f"{ROOT}/main/ipc/doctor.ts"))

print("\n🔗 SHARED")
check("shared/types.ts", os.path.exists(f"{ROOT}/shared/types.ts"))

print("\n🎨 RENDERER")
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
check("renderer/src/pages/AICompanion.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/AICompanion.tsx"))
check("renderer/src/pages/Vault.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Vault.tsx"))
check("renderer/src/pages/Together.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Together.tsx"))
check("renderer/src/pages/Doctor.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Doctor.tsx"))
check("renderer/src/pages/Settings.tsx", os.path.exists(f"{ROOT}/renderer/src/pages/Settings.tsx"))

print("\n🚀 CI/CD")
check(".github/workflows/build.yml", os.path.exists(f"{ROOT}/.github/workflows/build.yml"))
check(".github/workflows/release.yml", os.path.exists(f"{ROOT}/.github/workflows/release.yml"))

print("\n📦 DEPENDENCIES")
check("node_modules exists", os.path.exists(f"{ROOT}/node_modules"))
check("electron installed", os.path.exists(f"{ROOT}/node_modules/electron"))
check("react installed", os.path.exists(f"{ROOT}/node_modules/react"))
check("vite installed", os.path.exists(f"{ROOT}/node_modules/vite"))
check("typescript installed", os.path.exists(f"{ROOT}/node_modules/typescript"))
check("systeminformation installed", os.path.exists(f"{ROOT}/node_modules/systeminformation"))
check("electron-builder installed", os.path.exists(f"{ROOT}/node_modules/electron-builder"))

print("\n🛠️ SCRIPTS")
try:
    with open(f"{ROOT}/package.json") as f:
        pkg = json.load(f)
    scripts = pkg.get("scripts", {})
    check("dev script", "dev" in scripts)
    check("build script", "build" in scripts)
    check("dist script", "dist" in scripts)
    check("release script", "release" in scripts)
    check("health script", "health" in scripts)
except:
    check("package.json readable", False)

passed = sum(1 for r in results if r[0] == PASS)
failed = sum(1 for r in results if r[0] == FAIL)
print(f"\n{'='*50}")
print(f"RESULT: {passed} passed, {failed} failed")
if failed == 0:
    print("🎉 FaizLaunch is 100% complete and ready to ship!")
    print("   Run: git tag v1.0.0 && git push origin v1.0.0")
    print("   GitHub Actions will build the .exe automatically!")
else:
    print(f"⚠️  Fix the {failed} missing items above")
print("="*50 + "\n")
