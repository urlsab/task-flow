using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.Projects.API.Controllers;

[Route("api/projects")]
public class ProjectsController : BaseApiController
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService) =>
        _projectService = projectService;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _projectService.GetUserProjectsAsync(CurrentUserId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id) =>
        Ok(await _projectService.GetByIdAsync(id, CurrentUserId));

    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetStats(int id) =>
        Ok(await _projectService.GetStatsAsync(id, CurrentUserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request)
    {
        var result = await _projectService.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectRequest request) =>
        Ok(await _projectService.UpdateAsync(id, request, CurrentUserId));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _projectService.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }

    [HttpGet("health")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public IActionResult Health() => Ok(new { Service = "projects-api", Status = "healthy" });
}
