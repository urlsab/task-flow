using MassTransit;
using TaskFlow.Notifications.API.Data;
using TaskFlow.Notifications.API.Entities;
using TaskFlow.Shared.Contracts.Events;

namespace TaskFlow.Notifications.API.Consumers;

// Runs inside a MassTransit worker thread whenever a TaskCreatedEvent arrives from RabbitMQ.
// No HTTP request context — injects DbContext via DI the same as a controller would.
public class TaskCreatedConsumer : IConsumer<TaskCreatedEvent>
{
    private readonly NotificationsDbContext _db;
    private readonly ILogger<TaskCreatedConsumer> _logger;

    public TaskCreatedConsumer(NotificationsDbContext db, ILogger<TaskCreatedConsumer> logger)
    {
        _db     = db;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<TaskCreatedEvent> context)
    {
        var ev = context.Message;

        // Only create a notification if someone was assigned at creation time
        if (!ev.AssigneeId.HasValue)
            return;

        var notification = new Notification
        {
            UserId           = ev.AssigneeId.Value,
            Type             = "TaskCreated",
            Message          = $"You were assigned to \"{ev.Title}\" in project \"{ev.ProjectName}\".",
            RelatedTaskId    = ev.TaskId,
            RelatedProjectId = ev.ProjectId
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Notification created for user {UserId}: task {TaskId} created",
            ev.AssigneeId.Value, ev.TaskId);
    }
}
