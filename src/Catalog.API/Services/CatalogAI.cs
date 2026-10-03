using Pgvector;

namespace eShop.Catalog.API.Services;

public sealed class CatalogAI : ICatalogAI
{
    /// <summary>The web host environment.</summary>
    private readonly IWebHostEnvironment _environment;
    /// <summary>Logger for use in AI operations.</summary>
    private readonly ILogger _logger;

    public CatalogAI(IWebHostEnvironment environment, ILogger<CatalogAI> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    /// <inheritdoc/>
    public bool IsEnabled => false;

    /// <inheritdoc/>
    public ValueTask<Vector?> GetEmbeddingAsync(CatalogItem item) =>
        ValueTask.FromResult<Vector?>(null);

    /// <inheritdoc/>
    public ValueTask<IReadOnlyList<Vector>?> GetEmbeddingsAsync(IEnumerable<CatalogItem> items) =>
        ValueTask.FromResult<IReadOnlyList<Vector>?>(null);

    /// <inheritdoc/>
    public ValueTask<Vector?> GetEmbeddingAsync(string text) =>
        ValueTask.FromResult<Vector?>(null);
}
