using Deploy.DTOs;
using Deploy.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Deploy.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpPost("ask")]
    public async Task<ActionResult<ChatResponse>> Ask(
        [FromBody] ChatRequest request,
        [FromQuery] string? sessionId,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return BadRequest("Request body is required.");

        var resolvedSessionId = string.IsNullOrWhiteSpace(sessionId)
            ? Guid.NewGuid().ToString("N")
            : sessionId.Trim();

        try
        {
            var response = await _chatService.AskAsync(resolvedSessionId, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, "AI chat service encountered an error.");
        }
    }
}
