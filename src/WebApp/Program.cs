using eShop.ServiceDefaults;
using eShop.WebAppComponents.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.AddApplicationServices();

var app = builder.Build();

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapForwarder("/product-images/{id}", "https+http://catalog-api", "/api/catalog/items/{id}/pic");

// BFF Catalog endpoints
app.MapGet("/bff/catalog/items", async (CatalogService catalogService, int? pageIndex, int? pageSize, int? brand, int? type) =>
{
    var result = await catalogService.GetCatalogItems(pageIndex ?? 0, pageSize ?? 9, brand, type);
    return Results.Ok(result);
});

app.MapGet("/bff/catalog/items/{id:int}", async (CatalogService catalogService, int id) =>
{
    var item = await catalogService.GetCatalogItem(id);
    return item is not null ? Results.Ok(item) : Results.NotFound();
});

app.MapGet("/bff/catalog/brands", async (CatalogService catalogService) =>
{
    var brands = await catalogService.GetBrands();
    return Results.Ok(brands);
});

app.MapGet("/bff/catalog/types", async (CatalogService catalogService) =>
{
    var types = await catalogService.GetTypes();
    return Results.Ok(types);
});

// BFF Auth endpoints
app.MapGet("/bff/user", (HttpContext httpContext) =>
{
    if (httpContext.User.Identity?.IsAuthenticated == true)
    {
        return Results.Ok(new
        {
            isAuthenticated = true,
            userName = httpContext.User.FindFirst("name")?.Value ?? "",
            buyerId = httpContext.User.FindFirst("sub")?.Value ?? ""
        });
    }
    return Results.Ok(new { isAuthenticated = false, userName = "", buyerId = "" });
});

app.MapGet("/bff/login", (HttpContext httpContext) =>
{
    var returnUrl = httpContext.Request.Query["returnUrl"].FirstOrDefault() ?? "/";
    if (!Uri.TryCreate(returnUrl, UriKind.Relative, out _))
    {
        returnUrl = "/";
    }
    return Results.Challenge(
        new AuthenticationProperties { RedirectUri = returnUrl },
        [OpenIdConnectDefaults.AuthenticationScheme]);
});

app.MapPost("/bff/logout", async (HttpContext httpContext) =>
{
    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    await httpContext.SignOutAsync(OpenIdConnectDefaults.AuthenticationScheme);
}).RequireAuthorization();

// SPA catch-all fallback - must be last
app.MapFallbackToFile("react/index.html");

app.Run();
