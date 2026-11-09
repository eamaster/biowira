using Deploy.DTOs;
using Deploy.Interfaces;
using Deploy.Mappers;

namespace Deploy.Services;

public class AnimalService : IAnimalService
{
    private readonly IAnimalRepository _repository;

    public AnimalService(IAnimalRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<AnimalCardDto>> GetAllAnimalCardsAsync(string? animalGroup = null, int? limit = null, int? offset = null)
    {
        var items = await _repository.GetAllAnimalsWithDetailsAsync(animalGroup, limit, offset);
        return AnimalMapper.ToAnimalCardDtoList(items);
    }

    public async Task<PaginatedResultDto<AnimalCardDto>> GetAllAnimalCardsPaginatedAsync(string? animalGroup = null, int? limit = null, int? offset = null)
    {
        var items = await _repository.GetAllAnimalsWithDetailsAsync(animalGroup, limit, offset);
        var totalCount = await _repository.GetAnimalCountAsync(animalGroup);
        return new PaginatedResultDto<AnimalCardDto>
        {
            Items = AnimalMapper.ToAnimalCardDtoList(items),
            TotalCount = totalCount
        };
    }

    public async Task<PaginatedResultDto<AnimalCardV2Dto>> GetAllAnimalCardsV2PaginatedAsync(string? animalGroup = null, int? limit = null, int? offset = null)
    {
        var items = await _repository.GetAllAnimalsWithDetailsV2Async(animalGroup, limit, offset);
        var totalCount = await _repository.GetAnimalCountAsync(animalGroup);
        return new PaginatedResultDto<AnimalCardV2Dto>
        {
            Items = AnimalMapper.ToAnimalCardV2DtoList(items),
            TotalCount = totalCount
        };
    }

    public async Task<AnimalCardDetailDto?> GetAnimalCardDetailAsync(int animalId)
    {
        var animal = await _repository.GetAnimalByIdAsync(animalId);

        if (animal is null)
            return null;

        var animalGroup = await _repository.GetAnimalGroupByIdAsync(animal.GroupId);
        var conservationStatus = await _repository.GetConservationStatusByIdAsync(animal.ConservationStatusId);
        var threats = await _repository.GetThreatDetailsByAnimalIdAsync(animalId);
        var habitats = await _repository.GetHabitatDetailsByAnimalIdAsync(animalId);

        return AnimalMapper.ToAnimalCardDetailDto(animal, animalGroup, conservationStatus, threats, habitats);
    }

    public async Task<AnimalCardDetailV2Dto?> GetAnimalCardDetailV2Async(int animalId)
    {
        var result = await _repository.GetAnimalByIdWithImageAsync(animalId);

        if (result is null)
            return null;

        var (animal, animalGroup, conservationStatus, image) = result.Value;
        var threats = await _repository.GetThreatDetailsByAnimalIdAsync(animalId);
        var habitats = await _repository.GetHabitatDetailsByAnimalIdAsync(animalId);

        return AnimalMapper.ToAnimalCardDetailV2Dto(animal, animalGroup, conservationStatus, image, threats, habitats);
    }

    public async Task<IEnumerable<AnimalOccurrenceDto>?> GetAnimalOccurrencesAsync(int animalId)
    {
        var animal = await _repository.GetAnimalByIdAsync(animalId);

        if (animal is null)
            return null;

        var occurrences = await _repository.GetOccurrencesByAnimalIdAsync(animalId);
        return AnimalMapper.ToAnimalOccurrenceDtoList(occurrences);
    }
}
