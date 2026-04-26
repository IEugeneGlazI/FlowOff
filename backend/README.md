# Flowoff Backend

Current backend stage:

- Clean Architecture solution with `Domain`, `Application`, `Infrastructure`, `Web`
- ASP.NET Core Web API with controllers, Swagger, JWT authentication
- ASP.NET Core Identity integration with seeded roles and default admin
- email confirmation and password reset flow with email sender abstraction
- SQL Server / EF Core context with initial domain model
- current default database server: `I_EUGENE_I`
- soft delete is used for products, promotions, and users

Current email delivery behavior:

- emails are sent through a stub `LoggingEmailSender`
- confirmation links and reset tokens are written to application logs
- this can later be replaced by SMTP, SendGrid, or another provider without changing application layer contracts

Configuration notes:

- `appsettings.json` contains safe placeholder values for repository storage
- local secrets and machine-specific settings should live in `Flowoff.Web/appsettings.Development.json`
- an example local config is available in `Flowoff.Web/appsettings.Development.example.json`
- Current public and customer endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/confirm-email`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/resend-confirmation`
  - `GET /api/categories`
  - `GET /api/products`
  - `GET /api/products/{id}`
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PUT /api/cart/items`
  - `DELETE /api/cart/items/{productId}`
  - `DELETE /api/cart`
  - `GET /api/reservations/my`
  - `POST /api/reservations`
  - `DELETE /api/reservations/{reservationId}`
  - `GET /api/reservations/active`
  - `GET /api/supportrequests/my`
  - `POST /api/supportrequests`
  - `GET /api/supportrequests`
  - `PATCH /api/supportrequests/{id}/status`
  - `POST /api/orders`
  - `GET /api/orders/my`
  - `GET /api/florist/orders`
  - `GET /api/florist/orders/{id}`
  - `PATCH /api/florist/orders/{id}/assembly-status`
  - `PATCH /api/florist/orders/{id}/assign-courier`
  - `GET /api/couriers`
  - `GET /api/courier/orders`
  - `PATCH /api/courier/orders/{id}/delivery-status`
  - `GET /api/promotions`
  - `POST /api/promotions`
  - `PUT /api/promotions/{id}`
  - `DELETE /api/promotions/{id}`
  - `GET /api/admin/statistics`
  - `POST /api/custombouquets/calculate`
  - `POST /api/custombouquets`
  - `GET /api/custombouquets/my`
  - `PUT /api/products/{id}`
  - `PATCH /api/products/{id}/stock`
  - `DELETE /api/products/{id}`
  - `GET /api/references/statuses`
  - `GET /api/admin/users`
  - `PUT /api/admin/users/{id}`
  - `PATCH /api/admin/users/{id}/block`
  - `DELETE /api/admin/users/{id}`

Default admin:

- Email: `admin@flowoff.local`
- Password: `Admin123!`

Seeded role accounts:

- Florist: `florist@flowoff.local` / `Florist123!`
- Courier: `courier@flowoff.local` / `Courier123!`

Implemented business constraints in this phase:

- unique email through Identity configuration
- one role per user
- public registration creates only `Customer`
- login is blocked until email is confirmed
- password reset is available through token-based email flow
- delivery order cannot be created with pay-on-pickup
- delivery address is required for delivery orders
- only showcase bouquets can be reserved
- reservation duration cannot exceed 24 hours
- overlapping active reservations are blocked
- online payment is currently implemented as a stub and marks non-cash orders as paid
- florist/admin can create products
- florist/admin can view all orders and update assembly statuses
- florist/admin can assign courier after assembly is completed
- customer can create and view own orders
- customer can manage own cart
- customer can calculate and save custom bouquets from flowers
- customer can create and view own support requests
- courier can view assigned delivery orders and update delivery statuses
- administrator can create and edit promotions
- administrator can soft delete promotions and manage users
- administrator can view dashboard statistics for orders, revenue, reservations, and support
- administrator can review and update support request statuses
- status dictionaries are exposed via `/api/references/statuses`

Next recommended iteration:

1. Add migrations and move from `EnsureCreated()` to migrations.
2. Replace logging email sender with SMTP or external provider.
3. Implement promotions and custom bouquet constructor.
4. Add more detailed user profile editing and audit fields where needed.
5. Start React frontend with catalog, auth, cart, reservation, and checkout screens.
6. Replace `EnsureCreated()` with migrations.
