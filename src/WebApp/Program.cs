using eShop.ServiceDefaults;
using eShop.WebAppComponents.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.FileProviders;

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

// Serve wwwroot/ for shared assets (/css, /images, /icons, /fonts).
app.UseStaticFiles();

// Serve wwwroot/react/ at the root path so Vite's hashed bundle assets
// (referenced as /assets/index-<hash>.js from index.html) resolve.
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(app.Environment.WebRootPath, "react"))
});

app.UseAuthentication();
app.UseAuthorization();

app.MapForwarder("/product-images/{id}", "https+http://catalog-api", "/api/catalog/items/{id}/pic");

// BFF Catalog endpoints
app.MapGet("/bff/catalog/items", async (CatalogService catalogService, int? pageIndex, int? pageSize, int? brand, int? type) =>
{
    try
    {
        var result = await catalogService.GetCatalogItems(pageIndex ?? 0, pageSize ?? 9, brand, type);
        return Results.Ok(result);
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
    {
        return Results.NotFound();
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.BadRequest)
    {
        return Results.BadRequest();
    }
});

app.MapGet("/bff/catalog/items/{id:int}", async (CatalogService catalogService, int id) =>
{
    try
    {
        var item = await catalogService.GetCatalogItem(id);
        return item is not null ? Results.Ok(item) : Results.NotFound();
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
    {
        // CatalogService.GetCatalogItem uses GetFromJsonAsync, which throws
        // HttpRequestException on any non-2xx (including 404 for unknown ids).
        // Translate that back into a proper NotFound for BFF consumers.
        return Results.NotFound();
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.BadRequest)
    {
        // Catalog API returns 400 for invalid identifiers (e.g. id <= 0).
        // Propagate that to the client so bad input is not masked as 500.
        return Results.BadRequest();
    }
});

app.MapGet("/bff/catalog/brands", async (CatalogService catalogService) =>
{
    try
    {
        var brands = await catalogService.GetBrands();
        return Results.Ok(brands);
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
    {
        return Results.NotFound();
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.BadRequest)
    {
        return Results.BadRequest();
    }
});

app.MapGet("/bff/catalog/types", async (CatalogService catalogService) =>
{
    try
    {
        var types = await catalogService.GetTypes();
        return Results.Ok(types);
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
    {
        return Results.NotFound();
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.BadRequest)
    {
        return Results.BadRequest();
    }
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
