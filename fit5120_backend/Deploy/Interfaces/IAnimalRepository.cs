using Deploy.Models;

namespace Deploy.Interfaces;

public interface IAnimalRepository
{
    Task<Animal?> GetAnimalByIdAsync(int animalId);
    Task<(Animal Animal, AnimalGroup? AnimalGroup, ConservationStatus? ConservationStatus, Image? Image)?> GetAnimalByIdWithImageAsync(int animalId);
    Task<AnimalGroup?> GetAnimalGroupByIdAsync(int groupId);
    Task<ConservationStatus?> GetConservationStatusByIdAsync(int conservationStatusId);
    Task<IEnumerable<(Animal Animal, AnimalGroup? AnimalGroup, ConservationStatus? ConservationStatus)>> GetAllAnimalsWithDetailsAsync(string? animalGroup = null, int? limit = null, int? offset = null);
    Task<IEnumerable<(Animal Animal, AnimalGroup? AnimalGroup, ConservationStatus? ConservationStatus, Image? Image)>> GetAllAnimalsWithDetailsV2Async(string? animalGroup = null, int? limit = null, int? offset = null);
    Task<int> GetAnimalCountAsync(string? animalGroup = null);
    Task<IEnumerable<AnimalOccurrence>> GetOccurrencesByAnimalIdAsync(int animalId);
    Task<IEnumerable<(ThreatDetail Detail, ThreatCategory Category)>> GetThreatDetailsByAnimalIdAsync(int animalId);
    Task<IEnumerable<(HabitatDetail Detail, HabitatCategory Category)>> GetHabitatDetailsByAnimalIdAsync(int animalId);
}
