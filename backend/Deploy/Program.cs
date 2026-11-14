using Npgsql;
using Asp.Versioning;
using Asp.Versioning.Builder;
using Deploy.Interfaces;
using Deploy.Repositories;
using Deploy.Services;
using Deploy.Endpoints;
using Deploy.Helpers;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);

// Load .env from repo root (or current dir) for local secrets.
var envCandidates = new[]
{
    Path.Combine(builder.Environment.ContentRootPath, "..", ".env"),
    Path.Combine(builder.Environment.ContentRootPath, ".env")
};
foreach (var envPath in envCandidates)
{
    if (File.Exists(envPath))
    {
        Env.Load(envPath);
    }
}

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();

// Add API versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// Add Swagger with versioned docs
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Deploy",
        Version = "1.0"
    });
    options.SwaggerDoc("v2", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Deploy",
        Version = "2.0"
    });
});

// Add PostgreSQL connection (resolved from environment or tokenized appsettings)
var connectionString = ConfigurationHelpers.ResolveSetting(
    builder.Configuration,
    "ConnectionStrings:Postgres",
    "POSTGRES_CONNECTION_STRING",
    "ConnectionStrings__Postgres");
builder.Services.AddScoped<NpgsqlConnection>(_ => new NpgsqlConnection(connectionString));

// Register repositories and services
builder.Services.AddScoped<IAnimalRepository, AnimalRepository>();
builder.Services.AddScoped<IAnimalService, AnimalService>();
builder.Services.AddScoped<IQuizRepository, QuizRepository>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<IProfileRepository, ProfileRepository>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IFunFactRepository, FunFactRepository>();
builder.Services.AddScoped<IFunFactService, FunFactService>();
builder.Services.AddScoped<IMissionRepository, MissionRepository>();
builder.Services.AddScoped<IMissionService, MissionService>();
builder.Services.AddScoped<IBadgeRepository, BadgeRepository>();
builder.Services.AddScoped<IBadgeService, BadgeService>();
builder.Services.AddScoped<ITtsRepository, TtsRepository>();
builder.Services.AddScoped<ITtsService, TtsService>();
builder.Services.AddSingleton<IChatService, ChatService>();
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Deploy v1");
        options.SwaggerEndpoint("/swagger/v2/swagger.json", "Deploy v2");
    });
}

app.UseHttpsRedirection();
app.MapControllers();

// Create API version set
ApiVersionSet apiVersionSet = app.NewApiVersionSet()
    .HasApiVersion(new ApiVersion(1, 0))
    .HasApiVersion(new ApiVersion(2, 0))
    .ReportApiVersions()
    .Build();

// Map endpoints
app.MapAnimalEndpoints(apiVersionSet);
app.MapQuizEndpoints(apiVersionSet);
app.MapProfileEndpoints(apiVersionSet);
app.MapFunFactEndpoints(apiVersionSet);
app.MapMissionEndpoints(apiVersionSet);
app.MapBadgeEndpoints(apiVersionSet);
app.MapTtsEndpoints(apiVersionSet);

await app.RunAsync();

public partial class Program { }
