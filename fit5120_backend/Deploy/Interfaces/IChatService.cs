using Deploy.DTOs;

namespace Deploy.Interfaces;

public interface IChatService
{
    Task<ChatResponse> AskAsync(string sessionId, ChatRequest request, CancellationToken cancellationToken = default);
}
