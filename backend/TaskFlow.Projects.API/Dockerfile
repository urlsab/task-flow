FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY TaskFlow.sln .
COPY TaskFlow.Domain/TaskFlow.Domain.csproj                     TaskFlow.Domain/
COPY TaskFlow.Application/TaskFlow.Application.csproj           TaskFlow.Application/
COPY TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj     TaskFlow.Infrastructure/
COPY TaskFlow.Shared.Contracts/TaskFlow.Shared.Contracts.csproj TaskFlow.Shared.Contracts/
COPY TaskFlow.Projects.API/TaskFlow.Projects.API.csproj         TaskFlow.Projects.API/
RUN dotnet restore TaskFlow.Projects.API/TaskFlow.Projects.API.csproj

COPY . .
RUN dotnet publish TaskFlow.Projects.API/TaskFlow.Projects.API.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5002
EXPOSE 5002
ENTRYPOINT ["dotnet", "TaskFlow.Projects.API.dll"]
