namespace TaskFlow.Notifications.API.Entities;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }           // recipient
    public required string Message { get; set; }
    public required string Type { get; set; } // TaskCreated | StatusChanged | TaskAssigned
    public int? RelatedTaskId { get; set; }
    public int? RelatedProjectId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
