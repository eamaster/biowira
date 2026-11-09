namespace Deploy.DTOs;

public sealed class ChatRequest
{
    public string UserMessage { get; set; } = string.Empty;
    public string AnimalType { get; set; } = string.Empty;
}
