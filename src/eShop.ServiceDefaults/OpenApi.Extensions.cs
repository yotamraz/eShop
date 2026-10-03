using Asp.Versioning;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace eShop.ServiceDefaults;

public static partial class Extensions
{
    public static IApplicationBuilder UseDefaultOpenApi(this WebApplication app)
    {
        var configuration = app.Configuration;
        var openApiSection = configuration.GetSection("OpenApi");

        if (!openApiSection.Exists())
        {
            return app;
        }

        return app;
    }

    public static IHostApplicationBuilder AddDefaultOpenApi(
        this IHostApplicationBuilder builder,
        IApiVersioningBuilder? apiVersioning = default)
    {
        var openApi = builder.Configuration.GetSection("OpenApi");

        if (!openApi.Exists())
        {
            return builder;
        }

        if (apiVersioning is not null)
        {
            apiVersioning.AddApiExplorer(options =>
            {
                options.GroupNameFormat = "'v'VVV";
                options.DefaultApiVersionParameterDescription = "The API version, in the format 'major.minor'.";
            });
        }

        return builder;
    }
}
