namespace Deploy.Helpers;

/// <summary>
/// Resolves configuration secrets and connection strings consistently across environment variables
/// and tokenized appsettings templates (ignoring unreplaced #{TOKEN}# placeholders).
/// </summary>
public static class ConfigurationHelpers
{
    public static bool IsUnreplacedToken(string? value)
        => !string.IsNullOrWhiteSpace(value) && value.Contains("#{", StringComparison.Ordinal);

    public static string? ResolveSetting(IConfiguration configuration, string configKey, params string[] envVarNames)
    {
        foreach (var envVar in envVarNames)
        {
            var envValue = Environment.GetEnvironmentVariable(envVar);
            if (!string.IsNullOrWhiteSpace(envValue) && !IsUnreplacedToken(envValue))
                return envValue.Trim();
        }

        var configValue = configuration[configKey];
        if (!string.IsNullOrWhiteSpace(configValue) && !IsUnreplacedToken(configValue))
            return configValue.Trim();

        return null;
    }
}
