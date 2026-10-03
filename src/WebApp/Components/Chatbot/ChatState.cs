using System.Security.Claims;
using eShop.WebAppComponents.Services;

namespace eShop.WebApp.Chatbot;

// Simple stub types replacing Microsoft.Extensions.AI (not available in .NET 8)
public enum ChatRole { System, User, Assistant }

public class ChatMessage
{
    public ChatRole Role { get; }
    public string? Text { get; }

    public ChatMessage(ChatRole role, string? text)
    {
        Role = role;
        Text = text;
    }
}

public class ChatState
{
    private readonly ILogger _logger;

    public ChatState(
        ICatalogService catalogService,
        IBasketState basketState,
        ClaimsPrincipal user,
        IProductImageUrlProvider productImages,
        ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger(typeof(ChatState));

        Messages =
        [
            new ChatMessage(ChatRole.Assistant, """
                Hi! I'm the AdventureWorks Concierge. How can I help?
                """),
        ];
    }

    public IList<ChatMessage> Messages { get; }

    public Task AddUserMessageAsync(string userText, Action onMessageAdded)
    {
        Messages.Add(new ChatMessage(ChatRole.User, userText));
        onMessageAdded();

        Messages.Add(new ChatMessage(ChatRole.Assistant, "I'm sorry, but the AI chat service is not currently available."));
        onMessageAdded();

        return Task.CompletedTask;
    }
}
