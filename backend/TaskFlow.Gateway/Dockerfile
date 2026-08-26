FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY TaskFlow.sln .
COPY TaskFlow.Gateway/TaskFlow.Gateway.csproj TaskFlow.Gateway/
RUN dotnet restore TaskFlow.Gateway/TaskFlow.Gateway.csproj

COPY . .
RUN dotnet publish TaskFlow.Gateway/TaskFlow.Gateway.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "TaskFlow.Gateway.dll"]
