using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Deploy.DTOs;
using Deploy.Helpers;
using Deploy.Interfaces;

namespace Deploy.Services;

public sealed class ChatService : IChatService
{
    private const string GeminiModel = "gemini-2.5-flash";
    private const int MaxHistoryMessages = 24;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatService> _logger;
    private readonly ConcurrentDictionary<string, ChatSession> _sessions = new();

    public ChatService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ChatService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ChatResponse> AskAsync(string sessionId, ChatRequest request, CancellationToken cancellationToken = default)
    {
        var userMessage = request.UserMessage?.Trim() ?? string.Empty;
        var animalType = request.AnimalType?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(userMessage))
            throw new ArgumentException("UserMessage is required.");
        if (string.IsNullOrWhiteSpace(animalType))
            throw new ArgumentException("AnimalType is required.");

        var apiKey = ConfigurationHelpers.ResolveSetting(_configuration, "Gemini:ApiKey", "GEMINI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Gemini API service is not configured.");

        var session = _sessions.GetOrAdd(sessionId, _ => new ChatSession());
        session.Messages.Add(new ChatTurn("user", userMessage));
        TrimHistory(session.Messages);

        var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{GeminiModel}:generateContent?key={apiKey}";
        var payload = BuildPayload(session.Messages, animalType);
        var json = JsonSerializer.Serialize(payload);

        var client = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        using var response = await client.SendAsync(httpRequest, cancellationToken);
        var rawResponse = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Gemini call failed. SessionId={SessionId}, Status={Status}, Body={Body}", sessionId, (int)response.StatusCode, rawResponse);
            throw new InvalidOperationException($"Gemini request failed ({(int)response.StatusCode}): {rawResponse}");
        }

        var assistantText = ExtractGeminiText(rawResponse);
        if (string.IsNullOrWhiteSpace(assistantText))
            throw new InvalidOperationException("Gemini returned an empty response.");

        session.Messages.Add(new ChatTurn("model", assistantText));
        TrimHistory(session.Messages);

        return new ChatResponse
        {
            SessionId = sessionId,
            AnimalType = animalType,
            Reply = assistantText
        };
    }

    private static object BuildPayload(IReadOnlyCollection<ChatTurn> history, string animalType)
    {
        return new
        {
            systemInstruction = new
            {
                parts = new[]
                {
                    new
                    {
                        text = BuildAnimalPrompt(animalType)
                    }
                }
            },
            contents = history.Select(m => new
            {
                role = m.Role,
                parts = new[]
                {
                    new { text = m.Text }
                }
            })
        };
    }

    private static string BuildAnimalPrompt(string animalType)
    {
        var normalized = animalType.Trim();
        string systemInstruction = $"You are a friendly {normalized}. " +
            "Communicate using sounds and traits associated with this animal. " +
            "Keep answers educational for children but stay strictly in character.";

        return systemInstruction;
    }

    private static void TrimHistory(List<ChatTurn> messages)
    {
        if (messages.Count <= MaxHistoryMessages)
            return;

        var removeCount = messages.Count - MaxHistoryMessages;
        messages.RemoveRange(0, removeCount);
    }

    private static string ExtractGeminiText(string rawResponse)
    {
        using var document = JsonDocument.Parse(rawResponse);
        var root = document.RootElement;

        if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            return string.Empty;

        var first = candidates[0];
        if (!first.TryGetProperty("content", out var content))
            return string.Empty;
        if (!content.TryGetProperty("parts", out var parts) || parts.GetArrayLength() == 0)
            return string.Empty;

        var textBuilder = new StringBuilder();
        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var textElement))
                textBuilder.Append(textElement.GetString());
        }

        return textBuilder.ToString().Trim();
    }

    private sealed class ChatSession
    {
        public List<ChatTurn> Messages { get; } = new();
    }

    private sealed record ChatTurn(string Role, string Text);
}
