using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Notifications.API.Data;

namespace TaskFlow.Notifications.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationsDbContext _db;

    public NotificationsController(NotificationsDbContext db) => _db = db;

    private int CurrentUserId =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // GET /api/notifications?unreadOnly=true
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false)
    {
        var query = _db.Notifications.Where(n => n.UserId == CurrentUserId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var result = await query
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                n.Id,
                n.Message,
                n.Type,
                n.RelatedTaskId,
                n.RelatedProjectId,
                n.IsRead,
                n.CreatedAt
            })
            .ToListAsync();

        return Ok(result);
    }

    // GET /api/notifications/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var count = await _db.Notifications
            .CountAsync(n => n.UserId == CurrentUserId && !n.IsRead);

        return Ok(new { Count = count });
    }

    // PUT /api/notifications/{id}/read
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == CurrentUserId);

        if (notification is null)
            return NotFound();

        notification.IsRead = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/notifications/read-all
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _db.Notifications
            .Where(n => n.UserId == CurrentUserId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

        return NoContent();
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health() => Ok(new { Service = "notifications-api", Status = "healthy" });
}
