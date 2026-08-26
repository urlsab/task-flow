namespace TaskFlow.Shared.Contracts.Events;

// Published by Projects.API when a new task is created.
// Consumed by Notifications.API to notify the assignee.
public record TaskCreatedEvent(
    int TaskId,
    string Title,
    int ProjectId,
    string ProjectName,
    int? AssigneeId,
    int CreatedById,
    DateTime CreatedAt
);
