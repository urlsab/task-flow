using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.DTOs.Tasks;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.API.Controllers;

[Route("api/[controller]")]
public class TasksController : BaseApiController
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    // GET /api/tasks?projectId=1&status=1&priority=2&search=fix
    // All filters are optional except projectId
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int projectId,
        [FromQuery] TaskQueryParameters filters) =>
        Ok(await _taskService.GetProjectTasksAsync(projectId, CurrentUserId, filters));

    // GET /api/tasks/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id) =>
        Ok(await _taskService.GetByIdAsync(id, CurrentUserId));

    // POST /api/tasks
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        var result = await _taskService.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // PUT /api/tasks/5  — updates all fields including status (how you change Todo → InProgress)
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest request) =>
        Ok(await _taskService.UpdateAsync(id, request, CurrentUserId));

    // DELETE /api/tasks/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _taskService.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }
}
