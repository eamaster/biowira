using Asp.Versioning;
using Asp.Versioning.Builder;
using Deploy.Constants;
using Deploy.DTOs;
using Deploy.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Deploy.Endpoints;

public static class AnimalEndpoints
{
    public static void MapAnimalEndpoints(this WebApplication app, ApiVersionSet apiVersionSet)
    {
        // ── V1 ──
        var v1 = app.MapGroup("/api/v{version:apiVersion}/animals")
            .WithApiVersionSet(apiVersionSet)
            .MapToApiVersion(new ApiVersion(1, 0))
            .WithTags("Animals");

        v1.MapGet("/", GetAllAnimals)
            .WithName("GetAnimalList")
            .WithDescription(
                "Returns a list of animal cards. Optionally filter by animal group. " +
                "Available groups: Mammals, Birds, Reptiles, Amphibians, Marine & Freshwater, Insects.")
            .Produces<IEnumerable<AnimalCardDto>>(StatusCodes.Status200OK)
            .Produces<ErrorResponseDto>(StatusCodes.Status400BadRequest)
            .WithOpenApi(operation =>
            {
                var classParam = operation.Parameters.FirstOrDefault(p => p.Name == "animalClass");
                if (classParam is not null)
                {
                    classParam.Description =
                        "Filter by animal group. Available values: Mammals, Birds, Reptiles, Amphibians, Marine & Freshwater, Insects.";
                    classParam.Required = false;
                }

                operation.Responses["200"].Description = "A list of animal cards matching the optional group filter.";
                operation.Responses["400"].Description =
                    "Invalid animal group provided. Error code: INVALID_ANIMAL_GROUP. " +
                    "Response includes 'availableGroups' in details.";

                return operation;
            });

        v1.MapGet("/{animalId:int}", GetAnimalById)
            .WithName("GetAnimalCard")
            .WithDescription("Returns detailed information for a specific animal by its ID.")
            .Produces<AnimalCardDetailDto>(StatusCodes.Status200OK)
            .Produces<ErrorResponseDto>(StatusCodes.Status404NotFound)
            .WithOpenApi(operation =>
            {
                operation.Responses["200"].Description = "The detailed animal card for the given ID.";
                operation.Responses["404"].Description =
                    "Animal not found. Error code: ANIMAL_NOT_FOUND.";

                return operation;
            });

        v1.MapGet("/{animalId:int}/occurrence", GetAnimalOccurrences)
            .WithName("GetAnimalOccurrences")
            .WithDescription("Returns occurrence/sighting records for a specific animal by its ID.")
            .Produces<IEnumerable<AnimalOccurrenceDto>>(StatusCodes.Status200OK)
            .Produces<ErrorResponseDto>(StatusCodes.Status404NotFound)
            .WithOpenApi(operation =>
            {
                operation.Responses["200"].Description = "A list of occurrence records for the given animal.";
                operation.Responses["404"].Description =
                    "Animal not found. Error code: ANIMAL_NOT_FOUND.";

                return operation;
            });

        // ── V2 ──
        var v2 = app.MapGroup("/api/v{version:apiVersion}/animals")
            .WithApiVersionSet(apiVersionSet)
            .MapToApiVersion(new ApiVersion(2, 0))
            .WithTags("Animals");

        v2.MapGet("/", GetAllAnimalsV2)
            .WithName("GetAnimalListV2")
            .WithDescription(
                "Returns a paginated list of animal cards. Optionally filter by animal group. " +
                "Supports limit and offset for pagination. " +
                "Available groups: Mammals, Birds, Reptiles, Amphibians, Marine & Freshwater, Insects.")
            .Produces<PaginatedResultDto<AnimalCardV2Dto>>(StatusCodes.Status200OK)
            .Produces<ErrorResponseDto>(StatusCodes.Status400BadRequest)
            .WithOpenApi(operation =>
            {
                var classParam = operation.Parameters.FirstOrDefault(p => p.Name == "animalClass");
                if (classParam is not null)
                {
                    classParam.Description =
                        "Filter by animal group. Available values: Mammals, Birds, Reptiles, Amphibians, Marine & Freshwater, Insects.";
                    classParam.Required = false;
                }

                operation.Responses["200"].Description = "A paginated list of animal cards matching the optional group filter.";
                operation.Responses["400"].Description =
                    "Invalid animal group provided. Error code: INVALID_ANIMAL_GROUP. " +
                    "Response includes 'availableGroups' in details.";

                return operation;
            });

        v2.MapGet("/{animalId:int}", GetAnimalByIdV2)
            .WithName("GetAnimalCardV2")
            .WithDescription("Returns detailed information for a specific animal by its ID, including image attribution.")
            .Produces<AnimalCardDetailV2Dto>(StatusCodes.Status200OK)
            .Produces<ErrorResponseDto>(StatusCodes.Status404NotFound)
            .WithOpenApi(operation =>
            {
                operation.Responses["200"].Description = "The detailed animal card with image attribution for the given ID.";
                operation.Responses["404"].Description =
                    "Animal not found. Error code: ANIMAL_NOT_FOUND.";

                return operation;
            });
    }

    private static async Task<Results<Ok<IEnumerable<AnimalCardDto>>, BadRequest<ErrorResponseDto>>> GetAllAnimals(
        IAnimalService service,
        string? animalClass = null)
    {
        if (!string.IsNullOrWhiteSpace(animalClass) &&
            !AnimalGroups.Available.Contains(animalClass, StringComparer.OrdinalIgnoreCase))
        {
            return TypedResults.BadRequest(new ErrorResponseDto
            {
                ErrorCode = "INVALID_ANIMAL_GROUP",
                Details = new Dictionary<string, object?>
                {
                    ["availableGroups"] = AnimalGroups.Available
                }
            });
        }

        var animalCards = await service.GetAllAnimalCardsAsync(animalClass);
        return TypedResults.Ok(animalCards);
    }

    private static async Task<Results<Ok<PaginatedResultDto<AnimalCardV2Dto>>, BadRequest<ErrorResponseDto>>> GetAllAnimalsV2(
        IAnimalService service,
        string? animalClass = null,
        int? limit = null,
        int? offset = null)
    {
        if (!string.IsNullOrWhiteSpace(animalClass) &&
            !AnimalGroups.Available.Contains(animalClass, StringComparer.OrdinalIgnoreCase))
        {
            return TypedResults.BadRequest(new ErrorResponseDto
            {
                ErrorCode = "INVALID_ANIMAL_GROUP",
                Details = new Dictionary<string, object?>
                {
                    ["availableGroups"] = AnimalGroups.Available
                }
            });
        }

        var result = await service.GetAllAnimalCardsV2PaginatedAsync(animalClass, limit, offset);
        return TypedResults.Ok(result);
    }

    private static async Task<Results<Ok<AnimalCardDetailDto>, NotFound<ErrorResponseDto>>> GetAnimalById(int animalId, IAnimalService service)
    {
        var animalCard = await service.GetAnimalCardDetailAsync(animalId);

        if (animalCard is null)
            return TypedResults.NotFound(new ErrorResponseDto { ErrorCode = "ANIMAL_NOT_FOUND" });

        return TypedResults.Ok(animalCard);
    }

    private static async Task<Results<Ok<AnimalCardDetailV2Dto>, NotFound<ErrorResponseDto>>> GetAnimalByIdV2(int animalId, IAnimalService service)
    {
        var animalCard = await service.GetAnimalCardDetailV2Async(animalId);

        if (animalCard is null)
            return TypedResults.NotFound(new ErrorResponseDto { ErrorCode = "ANIMAL_NOT_FOUND" });

        return TypedResults.Ok(animalCard);
    }

    private static async Task<Results<Ok<IEnumerable<AnimalOccurrenceDto>>, NotFound<ErrorResponseDto>>> GetAnimalOccurrences(int animalId, IAnimalService service)
    {
        var occurrences = await service.GetAnimalOccurrencesAsync(animalId);

        if (occurrences is null)
            return TypedResults.NotFound(new ErrorResponseDto { ErrorCode = "ANIMAL_NOT_FOUND" });

        return TypedResults.Ok(occurrences);
    }
}
