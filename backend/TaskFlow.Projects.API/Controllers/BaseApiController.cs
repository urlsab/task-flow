using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TaskFlow.Projects.API.Controllers;

[ApiController]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    protected int CurrentUserId =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}
