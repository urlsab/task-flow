using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.DTOs.Finance;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.API.Controllers;

[Route("api/[controller]")]
public class FinanceController : BaseApiController
{
    private readonly IFinanceService _financeService;

    public FinanceController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard() =>
        Ok(await _financeService.GetDashboardAsync(CurrentUserId));

    [HttpGet("records")]
    public async Task<IActionResult> GetRecords([FromQuery] FinancialRecordQueryParameters query) =>
        Ok(await _financeService.GetRecordsAsync(CurrentUserId, query));

    [HttpGet("records/{id:int}")]
    public async Task<IActionResult> GetById(int id) =>
        Ok(await _financeService.GetByIdAsync(id, CurrentUserId));

    [HttpPost("records")]
    public async Task<IActionResult> Create([FromBody] CreateFinancialRecordRequest request)
    {
        var result = await _financeService.CreateAsync(CurrentUserId, request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("records/{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFinancialRecordRequest request) =>
        Ok(await _financeService.UpdateAsync(id, CurrentUserId, request));

    [HttpDelete("records/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _financeService.DeleteAsync(id, CurrentUserId);
        return NoContent();
    }
}
