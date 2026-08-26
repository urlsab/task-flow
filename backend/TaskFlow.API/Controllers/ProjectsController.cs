using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.DTOs.Projects;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.API.Controllers;

[Route("api/[controller]")]
public class ProjectsController : BaseApiController
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    // GET /api/projects
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _projectService.GetUserProjectsAsync(CurrentUserId));

    // GET /api/projects/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id) =>
        Ok(await _projectService.GetByIdAsync(id, CurrentUserId));

    // GET /api/projects/5/stats
    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetStats(int id) =>
        Ok(await _projectService.GetStatsAsync(id, CurrentUserId));

    // POST /api/projects  →  201 Created + Location header
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest request)
    {
        var result = await _projectService.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // PUT /api/projects/5  →  full replacement of the resource
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectRequest request) =>
        Ok(await _projectService.UpdateAsync(id, request, CurrentUserId));

    // DELETE /api/projects/5  →  204 No Content (REST: success, nothing to return)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _projectService.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }
}
