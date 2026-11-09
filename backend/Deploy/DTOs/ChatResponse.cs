namespace Deploy.DTOs;

public sealed class ChatResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string AnimalType { get; set; } = string.Empty;
    public string Reply { get; set; } = string.Empty;
}
