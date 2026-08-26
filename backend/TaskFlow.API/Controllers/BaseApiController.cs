using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TaskFlow.API.Controllers;

[ApiController]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    // Reads the numeric user ID from the JWT claim set by AuthService.GenerateToken()
    protected int CurrentUserId =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}
