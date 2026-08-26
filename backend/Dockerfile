# ── Stage 1: Build ────────────────────────────────────────────────────────
# The SDK image includes the compiler, test runner, and NuGet CLI (~750 MB).
# Too large for production — only used here to compile.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + project files first (without source code).
# Docker caches the "dotnet restore" layer. If only .cs files change (no new
# NuGet packages), restore is skipped on the next build — saves 30-60s.
COPY TaskFlow.sln .
COPY TaskFlow.Domain/TaskFlow.Domain.csproj                     TaskFlow.Domain/
COPY TaskFlow.Application/TaskFlow.Application.csproj           TaskFlow.Application/
COPY TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj     TaskFlow.Infrastructure/
COPY TaskFlow.Shared.Contracts/TaskFlow.Shared.Contracts.csproj TaskFlow.Shared.Contracts/
COPY TaskFlow.API/TaskFlow.API.csproj                           TaskFlow.API/
COPY TaskFlow.Gateway/TaskFlow.Gateway.csproj                   TaskFlow.Gateway/
COPY TaskFlow.Auth.API/TaskFlow.Auth.API.csproj                 TaskFlow.Auth.API/
COPY TaskFlow.Projects.API/TaskFlow.Projects.API.csproj         TaskFlow.Projects.API/
COPY TaskFlow.Notifications.API/TaskFlow.Notifications.API.csproj TaskFlow.Notifications.API/
RUN dotnet restore

# Now copy all source and publish a Release build
COPY . .
RUN dotnet publish TaskFlow.API/TaskFlow.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Stage 2: Run ──────────────────────────────────────────────────────────
# The ASP.NET Core runtime image is ~200 MB — no SDK, no compiler.
# Only the compiled DLL + its direct runtime dependencies are included.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# .NET 8 Docker images default to port 8080. Override to 5000 for clarity
# and consistency with our development setup.
ENV ASPNETCORE_HTTP_PORTS=5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "TaskFlow.API.dll"]
