namespace TaskFlow.Shared.Contracts.Events;

// Published by Projects.API when a task's status changes (e.g. Todo → InProgress).
// Consumed by Notifications.API to notify the assignee of the state change.
public record TaskStatusChangedEvent(
    int TaskId,
    string Title,
    int ProjectId,
    int? AssigneeId,
    string OldStatus,
    string NewStatus,
    int ChangedById,
    DateTime ChangedAt
);
