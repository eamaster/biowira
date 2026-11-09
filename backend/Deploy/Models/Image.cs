namespace Deploy.Models;

public class Image
{
    public int ImageId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? CreatorName { get; set; }
    public string? CreatorUrl { get; set; }
    public string? SourceName { get; set; }
    public string? SourceUrl { get; set; }
    public string? LicenseName { get; set; }
    public string? LicenseUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
