using MassTransit;
using TaskFlow.Notifications.API.Data;
using TaskFlow.Notifications.API.Entities;
using TaskFlow.Shared.Contracts.Events;

namespace TaskFlow.Notifications.API.Consumers;

public class TaskStatusChangedConsumer : IConsumer<TaskStatusChangedEvent>
{
    private readonly NotificationsDbContext _db;
    private readonly ILogger<TaskStatusChangedConsumer> _logger;

    public TaskStatusChangedConsumer(NotificationsDbContext db, ILogger<TaskStatusChangedConsumer> logger)
    {
        _db     = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<TaskStatusChangedEvent> context)
    {
        var ev = context.Message;

        if (!ev.AssigneeId.HasValue)
            return;

        var notification = new Notification
        {
            UserId           = ev.AssigneeId.Value,
            Type             = "StatusChanged",
            Message          = $"Task \"{ev.Title}\" moved from {ev.OldStatus} → {ev.NewStatus}.",
            RelatedTaskId    = ev.TaskId,
            RelatedProjectId = ev.ProjectId
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Notification created for user {UserId}: task {TaskId} status {Old} → {New}",
            ev.AssigneeId.Value, ev.TaskId, ev.OldStatus, ev.NewStatus);
    }
}
