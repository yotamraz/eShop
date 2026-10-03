using Aspire.Hosting;
using Aspire.Hosting.Lifecycle;
using eShop.AppHost;
using Microsoft.Extensions.DependencyInjection;

namespace eShop.AppHost.UnitTests;

[TestClass]
public class AppHostConfigurationTests
{
    [TestMethod]
    public void ForwardedHeadersExtensionRegistersLifecycleHook()
    {
        var builder = CreateBuilder();

        builder.AddForwardedHeaders();

        Assert.IsTrue(builder.Services.Any(sd => sd.ServiceType == typeof(IDistributedApplicationLifecycleHook)));
    }

    private static IDistributedApplicationBuilder CreateBuilder() =>
        DistributedApplication.CreateBuilder(new DistributedApplicationOptions
        {
            AssemblyName = typeof(AppHostConfigurationTests).Assembly.FullName,
            DisableDashboard = true
        });
}
