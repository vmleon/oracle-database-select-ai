# 05 — Verify OJDBC Java 23 Compatibility

## Problem

The `ojdbc17:23.7.0.25.01` driver on Maven Central lists support for JDK 17, 19, and 21. The project uses Java 23. JDK 23 is not in the officially supported list, though forward compatibility is common.

## Options

### Option A: Stay on Java 23, verify it works (recommended for POC)

- Test by running `./gradlew bootRun` against a real ADB
- Confirm no runtime errors related to JDBC, UCP, or TLS
- Accept the risk that it's not officially supported — this is a demo, not production

### Option B: Downgrade to Java 21

- Change `build.gradle` toolchain to `JavaLanguageVersion.of(21)`
- Update Ansible JDK package from `jdk-23` to `jdk-21`
- Safest option if any compatibility issues arise

### Option C: Resolved by TODO-04

If [TODO-04](04-switch-to-oracle-spring-boot-starter-ucp.md) switches to `oracle-spring-boot-starter-ucp:26.0.0`, check what OJDBC version it pulls in. The 26.x starter likely ships a driver compatible with newer JDKs.

```bash
./gradlew dependencies --configuration runtimeClasspath | grep ojdbc
```

If it pulls `ojdbc23` or a 26.x driver, this TODO is resolved.

## Files Affected

- `src/backend/build.gradle` — Java toolchain version
- `deploy/ansible/backend/java/tasks/main.yaml` — JDK package name
- `deploy/ansible/ops/base/tasks/main.yaml` — JDK headless package name

## Acceptance Criteria

- [ ] Backend starts and connects to ADB without JDBC/JDK compatibility errors
- [ ] Or: decision documented to downgrade to Java 21
