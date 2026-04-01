# 04 — Switch to oracle-spring-boot-starter-ucp

## Problem

The current `build.gradle` manually configures Oracle UCP by excluding HikariCP from `spring-boot-starter-jdbc` and declaring `ojdbc17` + `ucp` dependencies separately. Oracle provides an official Spring Boot Starter that autoconfigures UCP properly and pulls in compatible driver versions.

## What Needs to Change

### 1. Backend Dependencies

**File:** `src/backend/build.gradle`

Replace:

```groovy
implementation('org.springframework.boot:spring-boot-starter-jdbc') {
    exclude group: 'com.zaxxer', module: 'HikariCP'
}
implementation 'com.oracle.database.jdbc:ojdbc17:23.7.0.25.01'
implementation 'com.oracle.database.jdbc:ucp:23.7.0.25.01'
```

With:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-jdbc'
implementation 'com.oracle.database.spring:oracle-spring-boot-starter-ucp:26.0.0'
```

The starter handles HikariCP exclusion, JDBC driver selection, and UCP autoconfiguration.

### 2. Application Config

**File:** `src/backend/src/main/resources/application.yaml`

- Remove explicit `type: oracle.ucp.jdbc.PoolDataSourceImpl` if the starter handles datasource type
- Verify which `spring.datasource.oracleucp.*` properties the starter supports
- Keep connection pool sizing (min/max) — the starter should honor standard Spring properties

### 3. Ansible Template

**File:** `deploy/ansible/backend/java/files/application.yaml.j2`

- Same config simplification as above for the deployed version

## Relationship to TODO-05

If the starter v26.0.0 pulls in an ojdbc version that supports Java 23, this resolves [TODO-05](05-verify-ojdbc-java23-compatibility.md) automatically. Check the transitive dependency tree after switching:

```bash
./gradlew dependencies --configuration runtimeClasspath | grep ojdbc
```

## Acceptance Criteria

- [ ] `./gradlew build` succeeds with the starter dependency
- [ ] `./gradlew bootRun` connects to ADB without errors
- [ ] UCP connection pooling is active (check actuator `/health` or startup logs)
- [ ] No HikariCP on the classpath

## References

- [Oracle Spring Boot Starter for UCP](https://oracle.github.io/microservices-datadriven/spring/starters/ucp/)
- [Maven Central: oracle-spring-boot-starter-ucp](https://mvnrepository.com/artifact/com.oracle.database.spring/oracle-spring-boot-starter-ucp)
