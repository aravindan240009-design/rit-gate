# ===============================
# BUILD STAGE (Gradle Build)
# ===============================
FROM gradle:8.5-jdk17 AS build

WORKDIR /app

# Copy all project files
COPY . .

# Fix gradlew permission (VERY IMPORTANT)
RUN chmod +x ./gradlew

# Build the Spring Boot JAR (skip tests for faster build)
RUN ./gradlew clean build -x test

# ===============================
# RUNTIME STAGE (Lightweight)
# ===============================
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port (Render uses dynamic port)
EXPOSE 8080

# Run app with memory optimization for Render free tier (512MB RAM)
ENTRYPOINT ["java", \
  "-Xmx384m", \
  "-Xms128m", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-XX:MaxGCPauseMillis=200", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]