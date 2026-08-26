namespace TaskFlow.Shared.Contracts.Events;

// Published by Projects.API when a task is assigned (or re-assigned) to a user.
// Consumed by Notifications.API to notify the newly assigned user.
public record TaskAssignedEvent(
    int TaskId,
    string Title,
    int ProjectId,
    int AssigneeId,
    int AssignedById,
    DateTime AssignedAt
);
