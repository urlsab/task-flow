using MassTransit;
using TaskFlow.Notifications.API.Data;
using TaskFlow.Notifications.API.Entities;
using TaskFlow.Shared.Contracts.Events;

namespace TaskFlow.Notifications.API.Consumers;

public class TaskAssignedConsumer : IConsumer<TaskAssignedEvent>
{
    private readonly NotificationsDbContext _db;
    private readonly ILogger<TaskAssignedConsumer> _logger;

    public TaskAssignedConsumer(NotificationsDbContext db, ILogger<TaskAssignedConsumer> logger)
    {
        _db     = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<TaskAssignedEvent> context)
    {
        var ev = context.Message;

        var notification = new Notification
        {
            UserId           = ev.AssigneeId,
            Type             = "TaskAssigned",
            Message          = $"You were assigned to task \"{ev.Title}\".",
            RelatedTaskId    = ev.TaskId,
            RelatedProjectId = ev.ProjectId
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Notification created for user {UserId}: task {TaskId} assigned",
            ev.AssigneeId, ev.TaskId);
    }
}
