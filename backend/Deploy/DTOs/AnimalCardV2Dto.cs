namespace Deploy.DTOs;

public class AnimalCardV2Dto
{
    public int Id { get; set; }
    public string CommonName { get; set; } = string.Empty;
    public string ScientificName { get; set; } = string.Empty;
    public string AnimalClass { get; set; } = string.Empty;
    public string StatusCode { get; set; } = string.Empty;
    public string StatusLabel { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? ImageTitle { get; set; }
    public string? ImageCreatorName { get; set; }
    public string? ImageCreatorUrl { get; set; }
    public string? ImageSourceName { get; set; }
    public string? ImageSourceUrl { get; set; }
    public string? ImageLicenseName { get; set; }
    public string? ImageLicenseUrl { get; set; }
}
