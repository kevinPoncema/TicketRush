import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) { }

  async getTenantSummary(tenantId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const revenueResult = await queryRunner.query(
        `SELECT SUM(o.total_amount) as total_revenue
         FROM orders o
         JOIN tickets t ON t.order_id = o.id
         JOIN ticket_tiers tt ON tt.id = t.ticket_tier_id
         JOIN events e ON e.id = tt.event_id
         WHERE e.tenant_id = $1 AND o.status = 'PAID'`,
        [tenantId]
      );
      const correctRevenue = await queryRunner.query(
        `SELECT SUM(o.total_amount) as total_revenue
         FROM orders o
         WHERE o.status = 'PAID' AND o.id IN (
           SELECT DISTINCT o2.id
           FROM orders o2
           JOIN tickets t ON t.order_id = o2.id
           JOIN ticket_tiers tt ON tt.id = t.ticket_tier_id
           JOIN events e ON e.id = tt.event_id
           WHERE e.tenant_id = $1
         )`,
        [tenantId]
      );

      const ticketsResult = await queryRunner.query(
        `SELECT COUNT(t.id) as tickets_sold
         FROM tickets t
         JOIN ticket_tiers tt ON tt.id = t.ticket_tier_id
         JOIN events e ON e.id = tt.event_id
         WHERE e.tenant_id = $1 AND t.status = 'VALID'`,
        [tenantId]
      );

      const eventsResult = await queryRunner.query(
        `SELECT COUNT(id) as active_events
         FROM events
         WHERE tenant_id = $1 AND date >= NOW()`,
        [tenantId]
      );

      const chartData = await queryRunner.query(
        `SELECT DATE(o.created_at) as date, SUM(o.total_amount) as amount
         FROM orders o
         WHERE o.status = 'PAID' AND o.id IN (
           SELECT DISTINCT o2.id
           FROM orders o2
           JOIN tickets t ON t.order_id = o2.id
           JOIN ticket_tiers tt ON tt.id = t.ticket_tier_id
           JOIN events e ON e.id = tt.event_id
           WHERE e.tenant_id = $1
         )
         AND o.created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(o.created_at)
         ORDER BY DATE(o.created_at) ASC`,
        [tenantId]
      );

      return {
        totalRevenue: correctRevenue[0]?.total_revenue || 0,
        ticketsSold: parseInt(ticketsResult[0]?.tickets_sold || '0', 10),
        activeEvents: parseInt(eventsResult[0]?.active_events || '0', 10),
        chartData
      };
    } finally {
      await queryRunner.release();
    }
  }

  async getEventAnalytics(eventId: string, tenantId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const event = await queryRunner.query(
        `SELECT id FROM events WHERE id = $1 AND tenant_id = $2`,
        [eventId, tenantId]
      );
      if (!event.length) throw new ForbiddenException('Event not found or access denied');

      const revenueResult = await queryRunner.query(
        `SELECT SUM(o.total_amount) as total_revenue
         FROM orders o
         WHERE o.status = 'PAID' AND o.id IN (
           SELECT DISTINCT o2.id
           FROM orders o2
           JOIN tickets t ON t.order_id = o2.id
           JOIN ticket_tiers tt ON tt.id = t.ticket_tier_id
           WHERE tt.event_id = $1
         )`,
        [eventId]
      );

      const ticketsResult = await queryRunner.query(
        `SELECT COUNT(t.id) as tickets_sold
         FROM tickets t
         JOIN ticket_tiers tt ON tt.id = t.ticket_tier_id
         WHERE tt.event_id = $1 AND t.status = 'VALID'`,
        [eventId]
      );

      const chartData = await queryRunner.query(
        `SELECT DATE(o.created_at) as date, SUM(o.total_amount) as amount
         FROM orders o
         WHERE o.status = 'PAID' AND o.id IN (
           SELECT DISTINCT o2.id
           FROM orders o2
           JOIN tickets t ON t.order_id = o2.id
           JOIN ticket_tiers tt ON tt.id = t.ticket_tier_id
           WHERE tt.event_id = $1
         )
         AND o.created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(o.created_at)
         ORDER BY DATE(o.created_at) ASC`,
        [eventId]
      );

      const ticketsByTier = await queryRunner.query(
        `SELECT tt.name as tier, COUNT(t.id) as count
         FROM tickets t
         JOIN ticket_tiers tt ON tt.id = t.ticket_tier_id
         WHERE tt.event_id = $1 AND t.status = 'VALID'
         GROUP BY tt.id, tt.name`,
        [eventId]
      );

      return {
        totalRevenue: revenueResult[0]?.total_revenue || 0,
        ticketsSold: parseInt(ticketsResult[0]?.tickets_sold || '0', 10),
        chartData,
        ticketsByTier
      };
    } finally {
      await queryRunner.release();
    }
  }
}
