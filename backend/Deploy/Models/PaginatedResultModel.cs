namespace Deploy.Models;

public class PaginatedResultModel<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
}
