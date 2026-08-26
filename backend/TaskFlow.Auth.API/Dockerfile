FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Cache NuGet restore layer — only re-runs when a .csproj changes
COPY TaskFlow.sln .
COPY TaskFlow.Domain/TaskFlow.Domain.csproj                     TaskFlow.Domain/
COPY TaskFlow.Application/TaskFlow.Application.csproj           TaskFlow.Application/
COPY TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj     TaskFlow.Infrastructure/
COPY TaskFlow.Shared.Contracts/TaskFlow.Shared.Contracts.csproj TaskFlow.Shared.Contracts/
COPY TaskFlow.Auth.API/TaskFlow.Auth.API.csproj                 TaskFlow.Auth.API/
RUN dotnet restore TaskFlow.Auth.API/TaskFlow.Auth.API.csproj

COPY . .
RUN dotnet publish TaskFlow.Auth.API/TaskFlow.Auth.API.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5001
EXPOSE 5001
ENTRYPOINT ["dotnet", "TaskFlow.Auth.API.dll"]
