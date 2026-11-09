namespace Deploy.DTOs;

public class AnimalCardDetailV2Dto
{
    public string CommonName { get; set; } = string.Empty;
    public string ScientificName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string ConservationCode { get; set; } = string.Empty;
    public string ConservationLabel { get; set; } = string.Empty;
    public string ConservationDescription { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? ImageTitle { get; set; }
    public string? ImageCreatorName { get; set; }
    public string? ImageCreatorUrl { get; set; }
    public string? ImageSourceName { get; set; }
    public string? ImageSourceUrl { get; set; }
    public string? ImageLicenseName { get; set; }
    public string? ImageLicenseUrl { get; set; }
    public short SeverityOrder { get; set; }
    public string? Diet { get; set; }
    public string? Lifespan { get; set; }
    public string? Description { get; set; }
    public IEnumerable<ThreatDetailDto> Threats { get; set; } = [];
    public IEnumerable<HabitatDetailDto> Habitats { get; set; } = [];
}
