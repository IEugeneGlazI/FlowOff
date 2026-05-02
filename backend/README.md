# Flowoff Backend

Backend for the Flowoff flower shop application built with Clean Architecture.

## Solution structure

- `Flowoff.Domain` - entities, enums, repository interfaces
- `Flowoff.Application` - DTOs, services, business rules
- `Flowoff.Infrastructure` - EF Core, repositories, Identity, JWT, seeding
- `Flowoff.Web` - controllers, middleware, Swagger, configuration

## Current state

Implemented modules:

- `Auth`
- `Categories`
- `Colors`
- `FlowerIns`
- `Products`
- `Cart`
- `Orders`
- `FloristOrders`
- `CourierOrders`
- `Couriers`
- `Promotions`
- `SupportRequests`
- `AdminStatistics`
- `AdminUsers`
- `References`

## Catalog model

The catalog is stored in separate tables:

- `Bouquets`
- `Flowers`
- `Gifts`

Reference tables:

- `FlowerIns`
- `Colors`
- `Categories`

## Important notes

- reservation functionality was removed from the project
- `StockQuantity` was removed from the domain model, API, and frontend
- cart items and order items now store concrete links to `Bouquets`, `Flowers`, or `Gifts`
- email confirmation is required before login
- SMTP email sending is supported through the `Smtp` section in configuration
- public registration creates only `Customer`
- products, promotions, and users use soft delete where required

## Migrations

After schema changes:

```powershell
dotnet ef migrations add RebuildCatalogStructure --project .\Flowoff.Infrastructure\Flowoff.Infrastructure.csproj --startup-project .\Flowoff.Web\Flowoff.Web.csproj --output-dir Data\Migrations
dotnet ef database update --project .\Flowoff.Infrastructure\Flowoff.Infrastructure.csproj --startup-project .\Flowoff.Web\Flowoff.Web.csproj
```

## SMTP setup

Configure real email sending in `Flowoff.Web/appsettings.Development.json`:

```json
"Smtp": {
  "Host": "smtp.example.com",
  "Port": 587,
  "Username": "no-reply@example.com",
  "Password": "your-smtp-password",
  "FromEmail": "no-reply@example.com",
  "FromName": "Flowoff",
  "EnableSsl": true,
  "UseLoggingFallbackWhenNotConfigured": true
}
```

If `Host` or `FromEmail` is not filled, backend falls back to logging the email instead of sending it.
