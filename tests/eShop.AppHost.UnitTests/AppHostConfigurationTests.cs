using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Lifecycle;
using eShop.AppHost;
using Microsoft.Extensions.DependencyInjection;

namespace eShop.AppHost.UnitTests;

[TestClass]
public class AppHostConfigurationTests
{
    [TestMethod]
    public async Task ForwardedHeadersExtensionConfiguresDotnetProjectsOnly()
    {
        var builder = CreateBuilder();
        builder.AddForwardedHeaders();
        var catalog = builder.AddResource(new ProjectResource("catalog-api"));
        var webApp = builder.AddResource(new ProjectResource("webapp"));
        var redis = builder.AddRedis("redis");
        var annotationCounts = builder.Resources.ToDictionary(resource => resource, resource => resource.Annotations.Count);

        using var services = builder.Services.BuildServiceProvider();
        var model = services.GetRequiredService<DistributedApplicationModel>();

        foreach (var hook in services.GetServices<IDistributedApplicationLifecycleHook>())
        {
            await hook.BeforeStartAsync(model, CancellationToken.None);
        }

        foreach (var project in new[] { catalog.Resource, webApp.Resource })
        {
            var annotation = project.Annotations.Skip(annotationCounts[project])
                .OfType<EnvironmentCallbackAnnotation>().Single();
            var context = new EnvironmentCallbackContext(builder.ExecutionContext, cancellationToken: CancellationToken.None);
            await annotation.Callback(context);

            Assert.AreEqual("true", (string)context.EnvironmentVariables["ASPNETCORE_FORWARDEDHEADERS_ENABLED"]);
        }

        Assert.AreEqual(annotationCounts[redis.Resource], redis.Resource.Annotations.Count);
    }

    private static IDistributedApplicationBuilder CreateBuilder() =>
        DistributedApplication.CreateBuilder(new DistributedApplicationOptions
        {
            AssemblyName = typeof(AppHostConfigurationTests).Assembly.FullName,
            DisableDashboard = true
        });
}
