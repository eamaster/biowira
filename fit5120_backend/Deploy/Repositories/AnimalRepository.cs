using Npgsql;
using Dapper;
using Deploy.Models;
using Deploy.Interfaces;

namespace Deploy.Repositories;

public class AnimalRepository : IAnimalRepository
{
    private readonly NpgsqlConnection _connection;

    public AnimalRepository(NpgsqlConnection connection)
    {
        _connection = connection;
    }

    public async Task<Animal?> GetAnimalByIdAsync(int animalId)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        return await connection.QueryFirstOrDefaultAsync<Animal>(
            @"SELECT animal_id               AS Id,
                     common_name             AS CommonName,
                     scientific_name         AS ScientificName,
                     group_id                AS GroupId,
                     diet                    AS Diet,
                     lifespan                AS Lifespan,
                     description             AS Description,
                     conservation_status_id  AS ConservationStatusId,
                     image_url               AS ImageUrl,
                     avatar_path             AS AvatarPath,
                     created_at              AS CreatedAt,
                     updated_at              AS UpdatedAt
              FROM animal WHERE animal_id = @Id",
            new { Id = animalId });
    }

    public async Task<(Animal Animal, AnimalGroup? AnimalGroup, ConservationStatus? ConservationStatus, Image? Image)?> GetAnimalByIdWithImageAsync(int animalId)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        var sql = @"SELECT a.animal_id               AS Id,
                     a.common_name             AS CommonName,
                     a.scientific_name         AS ScientificName,
                     a.group_id                AS GroupId,
                     a.diet                    AS Diet,
                     a.lifespan                AS Lifespan,
                     a.description             AS Description,
                     a.conservation_status_id  AS ConservationStatusId,
                     a.image_url               AS ImageUrl,
                     a.created_at              AS CreatedAt,
                     a.updated_at              AS UpdatedAt,
                     g.group_id               AS GroupId,
                     g.group_name             AS GroupName,
                     cs.conservation_status_id AS Id,
                     cs.code                   AS Code,
                     cs.label                  AS Label,
                     cs.description            AS Description,
                     cs.severity_order         AS SeverityOrder,
                     i.image_id               AS ImageId,
                     i.url              AS ImageUrl,
                     i.title                  AS Title,
                     i.author_name           AS CreatorName,
                     i.author_url            AS CreatorUrl,
                     i.source_name            AS SourceName,
                     i.source_url             AS SourceUrl,
                     i.license_name           AS LicenseName,
                     i.license_url            AS LicenseUrl,
                     i.created_at             AS CreatedAt,
                     i.updated_at             AS UpdatedAt
              FROM animal a
              LEFT JOIN animal_group g           ON g.group_id = a.group_id
              LEFT JOIN conservation_status cs   ON cs.conservation_status_id = a.conservation_status_id
              LEFT JOIN image i                  ON i.image_id = a.image_id
              WHERE a.animal_id = @Id";

        var rows = await connection.QueryAsync<Animal, AnimalGroup, ConservationStatus, Image, (Animal, AnimalGroup?, ConservationStatus?, Image?)>(
            sql,
            (animal, ag, conservationStatus, image) => (animal, ag, conservationStatus, image),
            new { Id = animalId },
            splitOn: "GroupId,Id,ImageId");

        var row = rows.FirstOrDefault();
        if (row.Item1 is null)
            return null;

        return row;
    }

    public async Task<AnimalGroup?> GetAnimalGroupByIdAsync(int groupId)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        return await connection.QueryFirstOrDefaultAsync<AnimalGroup>(
            @"SELECT group_id   AS GroupId,
                     group_name AS GroupName
              FROM animal_group WHERE group_id = @GroupId",
            new { GroupId = groupId });
    }

    public async Task<ConservationStatus?> GetConservationStatusByIdAsync(int conservationStatusId)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        return await connection.QueryFirstOrDefaultAsync<ConservationStatus>(
            @"SELECT conservation_status_id AS Id,
                     code                   AS Code,
                     label                  AS Label,
                     description            AS Description,
                     severity_order         AS SeverityOrder
              FROM conservation_status WHERE conservation_status_id = @Id",
            new { Id = conservationStatusId });
    }

    public async Task<IEnumerable<(Animal Animal, AnimalGroup? AnimalGroup, ConservationStatus? ConservationStatus)>> GetAllAnimalsWithDetailsAsync(string? animalGroup = null, int? limit = null, int? offset = null)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        var sql = @"SELECT a.animal_id               AS Id,
                     a.common_name             AS CommonName,
                     a.scientific_name         AS ScientificName,
                     a.group_id                AS GroupId,
                     a.diet                    AS Diet,
                     a.lifespan                AS Lifespan,
                     a.conservation_status_id  AS ConservationStatusId,
                     a.image_url               AS ImageUrl,
                     a.avatar_path             AS AvatarPath,
                     a.created_at              AS CreatedAt,
                     a.updated_at              AS UpdatedAt,
                     g.group_id               AS GroupId,
                     g.group_name             AS GroupName,
                     cs.conservation_status_id AS Id,
                     cs.code                   AS Code,
                     cs.label                  AS Label,
                     cs.description            AS Description,
                     cs.severity_order         AS SeverityOrder
              FROM animal a
              LEFT JOIN animal_group g           ON g.group_id = a.group_id
              LEFT JOIN conservation_status cs   ON cs.conservation_status_id = a.conservation_status_id";

        if (!string.IsNullOrWhiteSpace(animalGroup))
            sql += "\n              WHERE LOWER(g.group_name) = LOWER(@AnimalGroup)";

        sql += "\n              ORDER BY a.animal_id";

        if (limit.HasValue)
            sql += "\n              LIMIT @Limit";

        if (offset.HasValue)
            sql += "\n              OFFSET @Offset";

        var rows = await connection.QueryAsync<Animal, AnimalGroup, ConservationStatus, (Animal, AnimalGroup?, ConservationStatus?)>(
            sql,
            (animal, ag, conservationStatus) => (animal, ag, conservationStatus),
            new { AnimalGroup = animalGroup, Limit = limit, Offset = offset },
            splitOn: "GroupId,Id");

        return rows;
    }

    public async Task<IEnumerable<(Animal Animal, AnimalGroup? AnimalGroup, ConservationStatus? ConservationStatus, Image? Image)>> GetAllAnimalsWithDetailsV2Async(string? animalGroup = null, int? limit = null, int? offset = null)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        var sql = @"SELECT a.animal_id               AS Id,
                     a.common_name             AS CommonName,
                     a.scientific_name         AS ScientificName,
                     a.group_id                AS GroupId,
                     a.diet                    AS Diet,
                     a.lifespan                AS Lifespan,
                     a.conservation_status_id  AS ConservationStatusId,
                     a.created_at              AS CreatedAt,
                     a.updated_at              AS UpdatedAt,
                     g.group_id               AS GroupId,
                     g.group_name             AS GroupName,
                     cs.conservation_status_id AS Id,
                     cs.code                   AS Code,
                     cs.label                  AS Label,
                     cs.description            AS Description,
                     cs.severity_order         AS SeverityOrder,
                     i.image_id               AS ImageId,
                     i.url              AS ImageUrl,
                     i.title                  AS Title,
                     i.author_name           AS CreatorName,
                     i.author_url            AS CreatorUrl,
                     i.source_name            AS SourceName,
                     i.source_url             AS SourceUrl,
                     i.license_name           AS LicenseName,
                     i.license_url            AS LicenseUrl,
                     i.created_at             AS CreatedAt,
                     i.updated_at             AS UpdatedAt
              FROM animal a
              LEFT JOIN animal_group g           ON g.group_id = a.group_id
              LEFT JOIN conservation_status cs   ON cs.conservation_status_id = a.conservation_status_id
              LEFT JOIN image i                  ON i.image_id = a.image_id";

        if (!string.IsNullOrWhiteSpace(animalGroup))
            sql += "\n              WHERE LOWER(g.group_name) = LOWER(@AnimalGroup)";

        sql += "\n              ORDER BY a.animal_id";

        if (limit.HasValue)
            sql += "\n              LIMIT @Limit";

        if (offset.HasValue)
            sql += "\n              OFFSET @Offset";

        var rows = await connection.QueryAsync<Animal, AnimalGroup, ConservationStatus, Image, (Animal, AnimalGroup?, ConservationStatus?, Image?)>(
            sql,
            (animal, ag, conservationStatus, image) => (animal, ag, conservationStatus, image),
            new { AnimalGroup = animalGroup, Limit = limit, Offset = offset },
            splitOn: "GroupId,Id,ImageId");

        return rows;
    }

    public async Task<int> GetAnimalCountAsync(string? animalGroup = null)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        var sql = @"SELECT COUNT(*)
              FROM animal a
              LEFT JOIN animal_group g ON g.group_id = a.group_id";

        if (!string.IsNullOrWhiteSpace(animalGroup))
            sql += "\n              WHERE LOWER(g.group_name) = LOWER(@AnimalGroup)";

        return await connection.ExecuteScalarAsync<int>(sql, new { AnimalGroup = animalGroup });
    }

    public async Task<IEnumerable<AnimalOccurrence>> GetOccurrencesByAnimalIdAsync(int animalId)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        return await connection.QueryAsync<AnimalOccurrence>(
            @"SELECT animal_occurrence_id AS Id,
                     animal_id            AS AnimalId,
                     latitude             AS Latitude,
                     longitude            AS Longitude,
                     created_at           AS CreatedAt
              FROM animal_occurrence
              WHERE animal_id = @AnimalId
              ORDER BY created_at DESC",
            new { AnimalId = animalId });
    }

    public async Task<IEnumerable<(ThreatDetail Detail, ThreatCategory Category)>> GetThreatDetailsByAnimalIdAsync(int animalId)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        var sql = @"SELECT td.threat_detail_id   AS ThreatDetailId,
                           td.animal_id          AS AnimalId,
                           td.threat_category_id AS ThreatCategoryId,
                           td.explanation        AS Explanation,
                           td.priority           AS Priority,
                           tc.threat_category_id AS ThreatCategoryId,
                           tc.threat_name        AS ThreatName
                    FROM threat_detail td
                    INNER JOIN threat_category tc ON tc.threat_category_id = td.threat_category_id
                    WHERE td.animal_id = @AnimalId
                    ORDER BY td.threat_detail_id";

        var rows = await connection.QueryAsync<ThreatDetail, ThreatCategory, (ThreatDetail, ThreatCategory)>(
            sql,
            (detail, category) => (detail, category),
            new { AnimalId = animalId },
            splitOn: "ThreatCategoryId");

        return rows;
    }

    public async Task<IEnumerable<(HabitatDetail Detail, HabitatCategory Category)>> GetHabitatDetailsByAnimalIdAsync(int animalId)
    {
        using var connection = new NpgsqlConnection(_connection.ConnectionString);
        await connection.OpenAsync();

        var sql = @"SELECT hd.habitat_detail_id   AS HabitatDetailId,
                           hd.animal_id           AS AnimalId,
                           hd.habitat_category_id AS HabitatCategoryId,
                           hd.priority            AS Priority,
                           hd.emoji               AS Emoji,
                           hc.habitat_category_id AS HabitatCategoryId,
                           hc.habitat_name        AS HabitatName
                    FROM habitat_detail hd
                    INNER JOIN habitat_category hc ON hc.habitat_category_id = hd.habitat_category_id
                    WHERE hd.animal_id = @AnimalId
                    ORDER BY hd.habitat_detail_id";

        var rows = await connection.QueryAsync<HabitatDetail, HabitatCategory, (HabitatDetail, HabitatCategory)>(
            sql,
            (detail, category) => (detail, category),
            new { AnimalId = animalId },
            splitOn: "HabitatCategoryId");

        return rows;
    }
}
