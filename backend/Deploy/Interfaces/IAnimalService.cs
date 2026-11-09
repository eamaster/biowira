using Deploy.DTOs;

namespace Deploy.Interfaces;

public interface IAnimalService
{
    Task<IEnumerable<AnimalCardDto>> GetAllAnimalCardsAsync(string? animalGroup = null, int? limit = null, int? offset = null);
    Task<PaginatedResultDto<AnimalCardDto>> GetAllAnimalCardsPaginatedAsync(string? animalGroup = null, int? limit = null, int? offset = null);
    Task<PaginatedResultDto<AnimalCardV2Dto>> GetAllAnimalCardsV2PaginatedAsync(string? animalGroup = null, int? limit = null, int? offset = null);
    Task<AnimalCardDetailDto?> GetAnimalCardDetailAsync(int animalId);
    Task<AnimalCardDetailV2Dto?> GetAnimalCardDetailV2Async(int animalId);
    Task<IEnumerable<AnimalOccurrenceDto>?> GetAnimalOccurrencesAsync(int animalId);
}
