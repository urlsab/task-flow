using Microsoft.EntityFrameworkCore;
using TaskFlow.Notifications.API.Entities;

namespace TaskFlow.Notifications.API.Data;

public class NotificationsDbContext : DbContext
{
    public NotificationsDbContext(DbContextOptions<NotificationsDbContext> options)
        : base(options) { }

    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Index to efficiently fetch all unread notifications for a user
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.IsRead });
    }
}
