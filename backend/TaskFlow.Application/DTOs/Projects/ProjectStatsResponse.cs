namespace TaskFlow.Application.DTOs.Projects;

public record ProjectStatsResponse(
    int ProjectId,
    string ProjectName,
    int TotalTasks,
    int TodoCount,
    int InProgressCount,
    int ReviewCount,
    int DoneCount,
    int OverdueTasks
);
