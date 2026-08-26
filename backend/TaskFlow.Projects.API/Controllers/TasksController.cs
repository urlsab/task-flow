using MassTransit;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Application.Interfaces;
using TaskFlow.Shared.Contracts.Events;

namespace TaskFlow.Projects.API.Controllers;

[Route("api/tasks")]
public class TasksController : BaseApiController
{
    private readonly ITaskService _taskService;
    private readonly IPublishEndpoint _publishEndpoint;

    public TasksController(ITaskService taskService, IPublishEndpoint publishEndpoint)
    {
        _taskService      = taskService;
        _publishEndpoint  = publishEndpoint;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int projectId,
        [FromQuery] TaskQueryParameters filters) =>
        Ok(await _taskService.GetProjectTasksAsync(projectId, CurrentUserId, filters));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id) =>
        Ok(await _taskService.GetByIdAsync(id, CurrentUserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        var result = await _taskService.CreateAsync(request, CurrentUserId);

        // Async event — Notifications.API will pick this up from RabbitMQ
        await _publishEndpoint.Publish(new TaskCreatedEvent(
            result.Id,
            result.Title,
            result.ProjectId,
            result.ProjectName,
            result.AssigneeId,
            result.CreatedById,
            result.CreatedAt
        ));

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest request)
    {
        // Snapshot the old state before applying changes
        var old = await _taskService.GetByIdAsync(id, CurrentUserId);
        var result = await _taskService.UpdateAsync(id, request, CurrentUserId);

        if (old.Status != result.Status)
        {
            await _publishEndpoint.Publish(new TaskStatusChangedEvent(
                result.Id,
                result.Title,
                result.ProjectId,
                result.AssigneeId,
                old.StatusLabel,
                result.StatusLabel,
                CurrentUserId,
                DateTime.UtcNow
            ));
        }

        // Publish TaskAssigned only when the assignee changes to a real user
        if (old.AssigneeId != result.AssigneeId && result.AssigneeId.HasValue)
        {
            await _publishEndpoint.Publish(new TaskAssignedEvent(
                result.Id,
                result.Title,
                result.ProjectId,
                result.AssigneeId!.Value,
                CurrentUserId,
                DateTime.UtcNow
            ));
        }

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _taskService.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }
}
